import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { embedTexts, toVectorLiteral } from "@/lib/kb.server";
import {
  EMBEDDING_MODEL,
  SYNC_TYPES,
  type SyncType,
  ingestCmsRecord,
  removeCmsDocument,
  recordTitle,
  retryFailedIngestions,
} from "@/lib/kb-sync.server";

export { SYNC_TYPES, type SyncType };

// ---------------------------------------------------------------- helpers
async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden: admin access required");
}

async function logActivity(
  context: { supabase: any; userId: string },
  action: string,
  metadata: Record<string, unknown>,
) {
  try {
    await context.supabase
      .from("activity_logs")
      .insert({ user_id: context.userId, action, metadata });
  } catch {
    /* non-fatal */
  }
}

const syncTypeSchema = z.enum([
  "government_services",
  "legal_topics",
  "faqs",
  "schemes",
  "complaint_templates",
  "glossary",
]);

// ---------------------------------------------------------------- overview
export const kbSyncOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const sb = context.supabase as any;

    const results = await Promise.all(
      SYNC_TYPES.map(async (cfg) => {
        const { count: total } = await sb
          .from(cfg.table)
          .select("id", { count: "exact", head: true });
        const { count: synced } = await sb
          .from("knowledge_documents")
          .select("id", { count: "exact", head: true })
          .eq("source", "cms_sync")
          .eq("status", "processed")
          .like("slug", `cms:${cfg.type}:%`);
        const { count: failed } = await sb
          .from("knowledge_documents")
          .select("id", { count: "exact", head: true })
          .eq("source", "cms_sync")
          .eq("status", "failed")
          .like("slug", `cms:${cfg.type}:%`);
        const t = total ?? 0;
        const s = synced ?? 0;
        const f = failed ?? 0;
        return {
          type: cfg.type,
          label: cfg.label,
          total: t,
          synced: s,
          failed: f,
          pending: Math.max(0, t - s - f),
        };
      }),
    );

    const { count: chunks } = await sb
      .from("rag_chunks")
      .select("id", { count: "exact", head: true });

    return { types: results, totalChunks: chunks ?? 0 };
  });

// ---------------------------------------------------------------- list targets
export const listSyncTargets = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ type: syncTypeSchema }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const sb = context.supabase as any;
    const cfg = SYNC_TYPES.find((t) => t.type === data.type)!;

    const cols =
      data.type === "faqs"
        ? "id, question"
        : data.type === "glossary"
          ? "id, term"
          : "id, title";
    const { data: rows, error } = await sb.from(cfg.table).select(cols).limit(1000);
    if (error) throw new Error(error.message);

    const { data: docs } = await sb
      .from("knowledge_documents")
      .select("id, slug, status, chunk_count, last_processed_at")
      .eq("source", "cms_sync")
      .like("slug", `cms:${data.type}:%`);
    const docMap = new Map<string, any>();
    for (const d of docs ?? []) {
      const recId = String(d.slug).split(":")[2];
      docMap.set(recId, d);
    }

    return (rows ?? []).map((r: any) => {
      const doc = docMap.get(r.id);
      return {
        id: r.id as string,
        title: recordTitle(data.type, r),
        documentId: (doc?.id as string) ?? null,
        status: (doc?.status as string) ?? "not_synced",
        chunkCount: (doc?.chunk_count as number) ?? 0,
        lastProcessedAt: (doc?.last_processed_at as string) ?? null,
      };
    });
  });

// ---------------------------------------------------------------- sync one record
export const syncRecord = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ type: syncTypeSchema, id: z.string().uuid() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const sb = context.supabase as any;
    const result = await ingestCmsRecord(sb, data.type, data.id, context.userId);
    await logActivity(context, "kb_sync_record", {
      type: data.type,
      record_id: data.id,
      document_id: result.documentId,
      chunks: result.chunks,
    });
    return { ok: true, documentId: result.documentId, chunks: result.chunks, status: "processed" as const };
  });

// ---------------------------------------------------------------- rebuild embeddings
export const rebuildEmbeddings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ documentId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const sb = context.supabase as any;

    const { data: chunks, error } = await sb
      .from("rag_chunks")
      .select("id, chunk_text")
      .eq("document_id", data.documentId)
      .order("chunk_index", { ascending: true });
    if (error) throw new Error(error.message);
    if (!chunks?.length) throw new Error("No chunks to rebuild — run a sync first");

    const embeddings = await embedTexts(
      chunks.map((c: any) => c.chunk_text),
      EMBEDDING_MODEL,
    );
    for (let i = 0; i < chunks.length; i++) {
      await sb
        .from("rag_chunks")
        .update({
          embedding: embeddings[i] ? toVectorLiteral(embeddings[i]) : null,
          embedding_status: embeddings[i] ? "embedded" : "pending",
          embedding_model: EMBEDDING_MODEL,
          model_version: EMBEDDING_MODEL,
        })
        .eq("id", chunks[i].id);
    }

    await sb
      .from("knowledge_documents")
      .update({ status: "processed", last_processed_at: new Date().toISOString() })
      .eq("id", data.documentId);

    await logActivity(context, "kb_rebuild_embeddings", {
      document_id: data.documentId,
      chunks: chunks.length,
    });

    return { ok: true, chunks: chunks.length };
  });

// ---------------------------------------------------------------- delete synced doc
export const deleteSyncedDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ documentId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const sb = context.supabase as any;
    await sb.from("rag_chunks").delete().eq("document_id", data.documentId);
    const { error } = await sb.from("knowledge_documents").delete().eq("id", data.documentId);
    if (error) throw new Error(error.message);
    await logActivity(context, "kb_delete_document", { document_id: data.documentId });
    return { ok: true };
  });

// ---------------------------------------------------------------- retry failures
export const retryFailedSyncs = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ limit: z.number().int().min(1).max(50).optional() }).parse(d ?? {}),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const sb = context.supabase as any;
    const result = await retryFailedIngestions(sb, context.userId, data.limit ?? 25);
    await logActivity(context, "kb_retry_failed_syncs", result);
    return result;
  });
