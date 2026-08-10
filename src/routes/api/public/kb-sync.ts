import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { ingestCmsRecord, removeCmsDocument, type SyncType } from "@/lib/kb-sync.server";

const bodySchema = z.object({
  type: z.enum([
    "government_services",
    "legal_topics",
    "faqs",
    "schemes",
    "complaint_templates",
    "glossary",
  ]),
  id: z.string().uuid(),
  op: z.enum(["insert", "update", "delete"]),
});

// Called asynchronously by database triggers whenever CMS content changes.
// Authenticated with a dedicated server-side secret (never exposed to the browser).
export const Route = createFileRoute("/api/public/kb-sync")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const provided = request.headers.get("x-kb-sync-secret") ?? "";
        const expected = process.env.KB_SYNC_WEBHOOK_SECRET ?? "";
        if (!expected || provided.length !== expected.length || provided !== expected) {
          return new Response("Unauthorized", { status: 401 });
        }

        let parsed;
        try {
          parsed = bodySchema.parse(await request.json());
        } catch {
          return new Response("Bad request", { status: 400 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const type = parsed.type as SyncType;

        try {
          if (parsed.op === "delete") {
            await removeCmsDocument(supabaseAdmin, type, parsed.id);
          } else {
            await ingestCmsRecord(supabaseAdmin, type, parsed.id);
          }
          return Response.json({ ok: true });
        } catch (e) {
          const message = e instanceof Error ? e.message : "sync failed";
          console.error("kb-autosync error", message);

          // Return 200 so pg_net does not treat this as an infrastructure error;
          // the failure is captured in the audit log and document status.
          return Response.json({ ok: false, error: message });
        }
      },
    },
  },
});
