import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { createClient } from "@supabase/supabase-js";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";
import {
  BASE_SYSTEM_PROMPT,
  contextSystemPrompt,
} from "@/lib/ai-prompts";

type Body = {
  messages?: unknown;
  conversationId?: string;
  contextType?: "government-service" | "legal-topic";
  contextSlug?: string;
};

function partsToText(m: UIMessage): string {
  return m.parts
    .map((p) => (p.type === "text" ? p.text : ""))
    .join("")
    .slice(0, 8000); // cap to limit prompt-injection payload size
}

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("AI not configured", { status: 500 });

        // ---- Auth: verify the bearer token ----
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

        const body = (await request.json()) as Body;
        if (!Array.isArray(body.messages)) {
          return new Response("Messages are required", { status: 400 });
        }
        const messages = body.messages as UIMessage[];

        // ---- Build system prompt (optionally page-scoped) ----
        let system = BASE_SYSTEM_PROMPT;
        if (body.contextType && body.contextSlug) {
          try {
            if (body.contextType === "government-service") {
              const { data: svc } = await authClient
                .from("government_services")
                .select("title, description, category, eligibility, fees, processing_time")
                .eq("slug", body.contextSlug)
                .maybeSingle();
              if (svc) {
                const { data: steps } = await authClient
                  .from("procedures")
                  .select("step_number, title, description")
                  .eq("service_id", (svc as { id?: string }).id ?? "")
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
            // fall back to base prompt
          }
        }

        const gateway = createLovableAiGatewayProvider(key);
        const model = gateway("google/gemini-3-flash-preview");

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
              const { supabaseAdmin } = await import(
                "@/integrations/supabase/client.server"
              );
              let conversationId = body.conversationId;

              // Create conversation if needed
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

              const lastUser = [...messages].reverse().find((m) => m.role === "user");
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
