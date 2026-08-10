import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { verifyLinkBatch } from "@/lib/link-check.server";

const bodySchema = z.object({
  offset: z.number().int().min(0).optional(),
  limit: z.number().int().min(1).max(25).optional(),
  continue: z.boolean().optional(),
});

/**
 * Automated weekly official-link verification (invoked by the scheduler).
 * Protected by the dedicated server-side webhook secret.
 * Processes bounded, resumable batches so large source sets never time out.
 */
export const Route = createFileRoute("/api/public/verify-links")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const provided = request.headers.get("x-kb-sync-secret") ?? "";
        const expected = process.env.KB_SYNC_WEBHOOK_SECRET ?? "";
        if (!expected || provided.length !== expected.length || provided !== expected) {
          return new Response("Unauthorized", { status: 401 });
        }

        let body: z.infer<typeof bodySchema>;
        try {
          body = bodySchema.parse(await request.json().catch(() => ({})));
        } catch {
          return new Response("Bad request", { status: 400 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const totals = {
          processed: 0,
          verified: 0,
          broken: 0,
          redirected: 0,
          needsReview: 0,
          total: 0,
        };
        let offset = body.offset ?? 0;
        // Bound the work per invocation; the scheduler re-enters weekly and the
        // loop stops well before any serverless timeout.
        const maxBatches = body.continue === false ? 1 : 6;

        for (let i = 0; i < maxBatches; i++) {
          const r = await verifyLinkBatch(supabaseAdmin, { offset, limit: body.limit ?? 10 });
          totals.processed += r.processed;
          totals.verified += r.verified;
          totals.broken += r.broken;
          totals.redirected += r.redirected;
          totals.needsReview += r.needsReview;
          totals.total = r.total;
          if (r.nextOffset == null) {
            offset = 0;
            return Response.json({ ok: true, done: true, ...totals });
          }
          offset = r.nextOffset;
        }

        return Response.json({ ok: true, done: false, nextOffset: offset, ...totals });
      },
    },
  },
});
