import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { createClient } from "@supabase/supabase-js";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";
import { embedTexts, toVectorLiteral } from "@/lib/kb.server";
import { BASE_SYSTEM_PROMPT, contextSystemPrompt } from "@/lib/ai-prompts";

type Body = {
  messages?: unknown;
  conversationId?: string;
  contextType?: "government-service" | "legal-topic";
  contextSlug?: string;
};

// Indian states/UTs used to detect jurisdiction in a query and prioritise chunks.
const STATES = [
  "Andhra Pradesh", "Telangana", "Karnataka", "Tamil Nadu", "Kerala", "Maharashtra",
  "Gujarat", "Rajasthan", "Punjab", "Haryana", "Uttar Pradesh", "Madhya Pradesh",
  "Bihar", "West Bengal", "Odisha", "Assam", "Jharkhand", "Chhattisgarh",
  "Uttarakhand", "Himachal Pradesh", "Goa", "Delhi",
];

function detectState(text: string): string | null {
  const lower = text.toLowerCase();
  for (const s of STATES) if (lower.includes(s.toLowerCase())) return s;
  return null;
}

function partsToText(m: UIMessage): string {
  return m.parts
    .map((p) => (p.type === "text" ? p.text : ""))
    .join("")
    .slice(0, 8000);
}

type RetrievedChunk = {
  chunk_id: string;
  chunk_text: string;
  similarity: number;
  doc_title: string;
  source: string | null;
  source_url: string | null;
  content_trust_level: string;
  last_verified_date: string | null;
  confidence_score: number | null;
};

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("AI not configured", { status: 500 });

        const authHeader = request.headers.get("Authorization") ?? "";
        const token = authHeader.replace(/^Bearer\s+/i, "").trim();
        if (!token) return new Response("Unauthorized", { status: 401 });

        const supabaseUrl = process.env.SUPABASE_URL!;
        const publishable = process.env.SUPABASE_PUBLISHABLE_KEY!;
        const authClient = createClient(supabaseUrl, publishable, {
          auth: { persistSession: false, autoRefreshToken: false },
          global: { headers: { Authorization: `Bearer ${token}` } },
        });
        const { data: userData, error: userErr } = await authClient.auth.getUser(token);
        if (userErr || !userData.user) {
          return new Response("Unauthorized", { status: 401 });
        }
        const userId = userData.user.id;

        // ---- Rate limiting (admins unlimited, registered users 100/day IST) ----
        const DAILY_LIMIT = 100;
        let isAdmin = false;
        try {
          const { data: adm } = await authClient.rpc("has_role", {
            _user_id: userId,
            _role: "admin",
          });
          isAdmin = Boolean(adm);
        } catch {
          /* default non-admin */
        }
        if (!isAdmin) {
          const { count } = await authClient
            .from("ai_usage_events")
            .select("id", { count: "exact", head: true })
            .eq("user_id", userId)
            .eq("event_type", "chat")
            .eq("rate_limited", false)
            .gte("created_at", startOfDayIso());
          if ((count ?? 0) >= DAILY_LIMIT) {
            try {
              await authClient.from("ai_usage_events").insert({
                user_id: userId,
                event_type: "chat",
                model: "google/gemini-3-flash-preview",
                rate_limited: true,
                succeeded: false,
              });
            } catch {
              /* non-fatal */
            }
            return new Response(
              JSON.stringify({
                error: "You have reached today's AI usage limit.",
                code: "rate_limited",
                limit: DAILY_LIMIT,
              }),
              { status: 429, headers: { "Content-Type": "application/json" } },
            );
          }
        }

        const body = (await request.json()) as Body;
        if (!Array.isArray(body.messages)) {
          return new Response("Messages are required", { status: 400 });
        }
        const messages = body.messages as UIMessage[];

        // ---- Base / page-scoped system prompt ----
        let system = BASE_SYSTEM_PROMPT;
        if (body.contextType && body.contextSlug) {
          try {
            if (body.contextType === "government-service") {
              const { data: svc } = await authClient
                .from("government_services")
                .select("id, title, description, category, eligibility, fees, processing_time")
                .eq("slug", body.contextSlug)
                .maybeSingle();
              if (svc) {
                const { data: steps } = await authClient
                  .from("procedures")
                  .select("step_number, title, description")
                  .eq("service_id", svc.id)
                  .order("step_number");
                const details = [
                  `Title: ${svc.title}`,
                  `Category: ${svc.category}`,
                  `Description: ${svc.description}`,
                  svc.eligibility ? `Eligibility: ${svc.eligibility}` : "",
                  svc.fees ? `Fees: ${svc.fees}` : "",
                  svc.processing_time ? `Processing time: ${svc.processing_time}` : "",
                  steps?.length
                    ? `Steps:\n${steps.map((s) => `${s.step_number}. ${s.title} — ${s.description}`).join("\n")}`
                    : "",
                ]
                  .filter(Boolean)
                  .join("\n");
                system = contextSystemPrompt({
                  kind: "government-service",
                  title: svc.title,
                  details,
                });
              }
            } else {
              const { data: topic } = await authClient
                .from("legal_topics")
                .select("title, category, description, overview, procedure")
                .eq("slug", body.contextSlug)
                .maybeSingle();
              if (topic) {
                const details = [
                  `Title: ${topic.title}`,
                  `Category: ${topic.category}`,
                  `Description: ${topic.description}`,
                  topic.overview ? `Overview: ${topic.overview}` : "",
                  topic.procedure ? `Procedure: ${topic.procedure}` : "",
                ]
                  .filter(Boolean)
                  .join("\n");
                system = contextSystemPrompt({
                  kind: "legal-topic",
                  title: topic.title,
                  details,
                });
              }
            }
          } catch {
            /* fall back to base prompt */
          }
        }

        // ---- RAG retrieval over the Knowledge Base ----
        const lastUser = [...messages].reverse().find((m) => m.role === "user");
        const query = lastUser ? partsToText(lastUser) : "";
        let retrieved: RetrievedChunk[] = [];
        let retrievalMs = 0;
        let retrievalSucceeded = false;
        const filterState = detectState(query);

        if (query.trim()) {
          const tStart = Date.now();
          try {
            const [embedding] = await embedTexts([query]);
            if (embedding) {
              const { data: chunks, error } = await authClient.rpc("match_chunks", {
                query_embedding: toVectorLiteral(embedding),
                match_count: 6,
                filter_state: filterState,
              });
              if (!error && Array.isArray(chunks)) {
                retrieved = chunks as RetrievedChunk[];
                retrievalSucceeded = retrieved.length > 0;
              }
            }
          } catch (e) {
            console.error("RAG retrieval error", e);
          }
          retrievalMs = Date.now() - tStart;
        }

        if (retrieved.length) {
          const sourcesBlock = retrieved
            .map((c, i) => {
              const verified = c.last_verified_date
                ? new Date(c.last_verified_date).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })
                : "Not specified";
              return [
                `--- KB Source [${i + 1}] ---`,
                `Document: ${c.doc_title}`,
                `Authority/Source: ${c.source ?? "Internal"}`,
                c.source_url ? `URL: ${c.source_url}` : "",
                `Trust Level: ${c.content_trust_level}`,
                `Last Verified: ${verified}`,
                `Content: ${c.chunk_text}`,
              ]
                .filter(Boolean)
                .join("\n");
            })
            .join("\n\n");

          system = `${system}

=== RETRIEVED KNOWLEDGE BASE CONTEXT (grounding) ===
Use ONLY the verified context below as your primary source of truth. Prefer higher trust levels (official > verified > reviewed). ${
            filterState ? `The user is asking about ${filterState}; prioritise ${filterState}-specific guidance.` : ""
          }
If the context does not answer the question, say so clearly and advise verifying with the official authority — do not invent facts.

At the END of every answer that uses this context, append a "Sources" section listing the Document title, Authority, URL (if any), and Last Verified date for each source you used.

${sourcesBlock}
=== END CONTEXT ===`;
        }

        const gateway = createLovableAiGatewayProvider(key);
        const model = gateway("google/gemini-3-flash-preview");
        const modelName = "google/gemini-3-flash-preview";
        const responseStart = Date.now();

        const avgConfidence = retrieved.length
          ? Number(
              (
                retrieved.reduce((s, c) => s + (c.similarity ?? 0), 0) / retrieved.length
              ).toFixed(3),
            )
          : null;

        const result = streamText({
          model,
          system,
          messages: await convertToModelMessages(messages),
          onError: (e) => console.error("AI stream error", e),
        });

        return result.toUIMessageStreamResponse({
          originalMessages: messages,
          onFinish: async ({ responseMessage }) => {
            try {
              // ---- Retrieval log (RLS: user inserts own) ----
              await authClient.from("retrieval_logs").insert({
                user_id: userId,
                query: query.slice(0, 2000),
                retrieved_chunk_ids: retrieved.map((c) => c.chunk_id),
                retrieval_time_ms: retrievalMs,
                response_time_ms: Date.now() - responseStart,
                model_used: modelName,
                confidence_score: avgConfidence,
                succeeded: retrievalSucceeded,
              });
            } catch (e) {
              console.error("retrieval log error", e);
            }

            try {
              const { supabaseAdmin } = await import(
                "@/integrations/supabase/client.server"
              );
              let conversationId = body.conversationId;

              if (!conversationId) {
                const firstUser = messages.find((m) => m.role === "user");
                const title = firstUser
                  ? partsToText(firstUser).slice(0, 60) || "New conversation"
                  : "New conversation";
                const { data: conv } = await supabaseAdmin
                  .from("conversations")
                  .insert({
                    user_id: userId,
                    title,
                    context_type: body.contextType ?? null,
                    context_slug: body.contextSlug ?? null,
                  })
                  .select("id")
                  .single();
                conversationId = conv?.id;
              } else {
                await supabaseAdmin
                  .from("conversations")
                  .update({ updated_at: new Date().toISOString() })
                  .eq("id", conversationId)
                  .eq("user_id", userId);
              }

              if (!conversationId) return;

              const rows = [];
              if (lastUser) {
                rows.push({
                  conversation_id: conversationId,
                  user_id: userId,
                  role: "user",
                  content: partsToText(lastUser),
                });
              }
              rows.push({
                conversation_id: conversationId,
                user_id: userId,
                role: "assistant",
                content: partsToText(responseMessage),
              });
              await supabaseAdmin.from("messages").insert(rows);
            } catch (e) {
              console.error("persist chat error", e);
            }
          },
        });
      },
    },
  },
});
