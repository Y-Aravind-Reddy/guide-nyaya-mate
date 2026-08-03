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

// Start of the current day in India Standard Time, as an ISO string.
function startOfDayIso(): string {
  const now = new Date();
  const ist = new Date(now.getTime() + 5.5 * 3600 * 1000);
  ist.setUTCHours(0, 0, 0, 0);
  return new Date(ist.getTime() - 5.5 * 3600 * 1000).toISOString();
}

// Rough token estimate (~4 chars/token) for usage accounting.
function estTokens(text: string): number {
  return Math.max(1, Math.ceil((text || "").length / 4));
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

// Structured citation surfaced to the client for each verified official source.
type Citation = {
  sourceName: string;
  department: string | null;
  authority: string | null;
  lastVerified: string | null;
  websiteUrl: string | null;
  applyOnlineUrl: string | null;
  formsUrl: string | null;
  relatedService: string | null;
  category: string | null;
};

function normUrl(u?: string | null): string | null {
  if (!u) return null;
  try {
    const url = new URL(u.trim());
    return `${url.hostname}${url.pathname}`.replace(/\/$/, "").toLowerCase();
  } catch {
    return u.trim().toLowerCase().replace(/\/$/, "");
  }
}

// Days after which a verified document should be re-checked.
const STALE_AFTER_DAYS = 180;

function daysSince(date?: string | null): number | null {
  if (!date) return null;
  const t = Date.parse(date);
  if (Number.isNaN(t)) return null;
  return Math.floor((Date.now() - t) / 86_400_000);
}

// Trust levels ranked for merge ordering (official first).
const TRUST_RANK: Record<string, number> = {
  official: 5,
  verified: 4,
  reviewed: 3,
  imported: 2,
  community: 1,
  draft: 0,
};

/**
 * Merge multi-document retrieval into a single ranked evidence set.
 * Ranks by relevance + verification status + recency + official-source priority.
 */
function rankChunks(chunks: RetrievedChunk[]): RetrievedChunk[] {
  const seen = new Set<string>();
  return chunks
    .filter((c) => {
      const k = c.chunk_text.slice(0, 160).toLowerCase();
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    })
    .map((c) => {
      const trust = (TRUST_RANK[c.content_trust_level] ?? 1) / 5;
      const age = daysSince(c.last_verified_date);
      const recency = age == null ? 0.4 : Math.max(0, 1 - age / 730);
      const official = c.source_url && /\.gov\.in|\.nic\.in/i.test(c.source_url) ? 1 : 0;
      const score =
        (c.similarity ?? 0) * 0.55 + trust * 0.2 + recency * 0.15 + official * 0.1;
      return { ...c, _score: score } as RetrievedChunk & { _score: number };
    })
    .sort((a, b) => (b as any)._score - (a as any)._score)
    .slice(0, 8);
}

/** Composite answer confidence: retrieval score, support count, trust, freshness. */
function computeConfidence(chunks: RetrievedChunk[]): number | null {
  if (!chunks.length) return null;
  const top = chunks.slice(0, 4);
  const rel = top.reduce((s, c) => s + (c.similarity ?? 0), 0) / top.length;
  const docs = new Set(chunks.map((c) => c.doc_title)).size;
  const support = Math.min(1, docs / 3);
  const trust =
    top.reduce((s, c) => s + (TRUST_RANK[c.content_trust_level] ?? 1) / 5, 0) / top.length;
  const freshness =
    top.reduce((s, c) => {
      const age = daysSince(c.last_verified_date);
      return s + (age == null ? 0.4 : Math.max(0, 1 - age / 730));
    }, 0) / top.length;
  return Number(
    (rel * 0.5 + support * 0.2 + trust * 0.2 + freshness * 0.1).toFixed(3),
  );
}

type Conflict = { topic: string; values: { value: string; source: string }[] };

/**
 * Heuristic conflict detection: the same fact type (fees / timelines) reported
 * with different values by different verified documents.
 */
function detectConflicts(chunks: RetrievedChunk[]): Conflict[] {
  const patterns: { topic: string; re: RegExp }[] = [
    { topic: "Fees", re: /₹\s?[\d,]+/g },
    { topic: "Processing time", re: /\b\d+\s?(?:–|-|to\s)?\s?\d*\s?(?:days?|weeks?|months?)\b/gi },
  ];
  const conflicts: Conflict[] = [];
  for (const { topic, re } of patterns) {
    const byValue = new Map<string, string>();
    for (const c of chunks) {
      const matches = c.chunk_text.match(re) ?? [];
      for (const m of matches.slice(0, 3)) {
        const v = m.trim().toLowerCase();
        if (!byValue.has(v)) byValue.set(v, c.doc_title);
      }
    }
    const entries = [...byValue.entries()];
    const distinctDocs = new Set(entries.map(([, d]) => d));
    if (entries.length > 1 && distinctDocs.size > 1) {
      conflicts.push({
        topic,
        values: entries.slice(0, 4).map(([value, source]) => ({ value, source })),
      });
    }
  }
  return conflicts;
}



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

        // ---- Build verified official-source citations (Part 2) ----
        const citations: Citation[] = [];
        try {
          const urlKeys = new Set(
            retrieved.map((c) => normUrl(c.source_url)).filter(Boolean) as string[],
          );
          const nameKeys = new Set(
            retrieved.map((c) => (c.source ?? "").trim().toLowerCase()).filter(Boolean),
          );
          if (urlKeys.size || nameKeys.size) {
            const { data: sources } = await authClient
              .from("official_sources")
              .select(
                "title, authority, department, source_url, apply_online_url, forms_url, last_verified_at, category, is_active, status",
              )
              .eq("is_active", true)
              .eq("status", "verified");
            for (const s of sources ?? []) {
              const matches =
                (s.source_url && urlKeys.has(normUrl(s.source_url) ?? "")) ||
                (s.title && nameKeys.has(s.title.trim().toLowerCase())) ||
                (s.authority && nameKeys.has(s.authority.trim().toLowerCase()));
              if (!matches) continue;
              if (citations.some((c) => c.sourceName === s.title)) continue;
              citations.push({
                sourceName: s.title,
                department: s.department ?? null,
                authority: s.authority ?? null,
                lastVerified: s.last_verified_at ?? null,
                websiteUrl: s.source_url ?? null,
                applyOnlineUrl: s.apply_online_url ?? null,
                formsUrl: s.forms_url ?? null,
                relatedService: retrieved[0]?.doc_title ?? null,
                category: s.category ?? null,
              });
            }
          }
        } catch (e) {
          console.error("citation lookup error", e);
        }


        const result = streamText({
          model,
          system,
          messages: await convertToModelMessages(messages),
          onError: (e) => console.error("AI stream error", e),
        });

        const lastUpdated = retrieved
          .map((c) => c.last_verified_date)
          .filter(Boolean)
          .sort()
          .reverse()[0] ?? null;
        const knowledgeCategory = citations[0]?.category ?? null;

        return result.toUIMessageStreamResponse({
          originalMessages: messages,
          messageMetadata: ({ part }) => {
            if (part.type === "finish") {
              return {
                citations,
                confidence: avgConfidence,
                sourceCount: retrieved.length,
                retrievalMs,
                responseTimeMs: Date.now() - responseStart,
                lastUpdated,
                knowledgeCategory,
                model: modelName,
              };
            }
            return undefined;
          },
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
              // ---- AI usage event (rate-limit accounting + usage dashboard) ----
              const promptTokens = estTokens(query) + estTokens(system);
              const completionTokens = estTokens(partsToText(responseMessage));
              const totalTokens = promptTokens + completionTokens;
              // Rough estimate in Lovable credits (embeddings + flash generation).
              const costEstimate = Number(((totalTokens / 1000) * 0.0006).toFixed(5));
              await authClient.from("ai_usage_events").insert({
                user_id: userId,
                event_type: "chat",
                model: modelName,
                prompt_tokens: promptTokens,
                completion_tokens: completionTokens,
                total_tokens: totalTokens,
                response_time_ms: Date.now() - responseStart,
                succeeded: true,
                rate_limited: false,
                cost_estimate: costEstimate,
              });
            } catch (e) {
              console.error("usage log error", e);
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
