import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  chunkText,
  chunkTypeForCategory,
  embedTexts,
  extractText,
  scoreChunk,
  sha256Hex,
  toVectorLiteral,
} from "@/lib/kb.server";

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
    await context.supabase.from("activity_logs").insert({
      user_id: context.userId,
      action,
      metadata,
    });
  } catch {
    /* non-fatal */
  }
}

export type DocumentRow = {
  id: string;
  title: string;
  slug: string | null;
  description: string | null;
  category: string | null;
  source: string;
  source_url: string | null;
  language: string;
  jurisdiction: string | null;
  state: string | null;
  author: string | null;
  visibility: string;
  last_verified_date: string | null;
  tags: string[];
  version: string;
  model_version: string | null;
  embedding_model: string;
  status: string;
  file_path: string | null;
  file_type: string | null;
  file_size: number | null;
  chunk_count: number;
  last_processed_at: string | null;
  created_at: string;
  updated_at: string;
  // production-grade RAG fields
  country: string | null;
  district: string | null;
  jurisdiction_type: string | null;
  content_trust_level: string;
  review_frequency: string | null;
  next_review_date: string | null;
  review_status: string;
  is_latest: boolean;
  previous_document_id: string | null;
  change_log: string | null;
  published_at: string | null;
  file_hash: string | null;
};

const DOC_COLS =
  "id, title, slug, description, category, source, source_url, language, jurisdiction, state, author, visibility, last_verified_date, tags, version, model_version, embedding_model, status, file_path, file_type, file_size, chunk_count, last_processed_at, created_at, updated_at, country, district, jurisdiction_type, content_trust_level, review_frequency, next_review_date, review_status, is_latest, previous_document_id, change_log, published_at, file_hash";

// ---------------------------------------------------------------- access
export const checkKbAccess = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    return { isAdmin: Boolean(data) };
  });

// ---------------------------------------------------------------- stats
export const kbStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const sb = context.supabase;
    const countBy = async (status?: string) => {
      let q = sb.from("knowledge_documents").select("id", { count: "exact", head: true });
      if (status) q = q.eq("status", status);
      const { count } = await q;
      return count ?? 0;
    };
    const [total, processed, pending, failed, processing] = await Promise.all([
      countBy(),
      countBy("processed"),
      countBy("pending"),
      countBy("failed"),
      countBy("processing"),
    ]);
    const { count: chunks } = await sb
      .from("rag_chunks")
      .select("id", { count: "exact", head: true });
    const { data: last } = await sb
      .from("knowledge_documents")
      .select("last_processed_at")
      .not("last_processed_at", "is", null)
      .order("last_processed_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    return {
      total,
      processed,
      pending,
      failed,
      processing,
      chunks: chunks ?? 0,
      lastSync: last?.last_processed_at ?? null,
    };
  });

// ---------------------------------------------------------------- list
export const listDocuments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        search: z.string().optional(),
        category: z.string().optional(),
        status: z.string().optional(),
        source: z.string().optional(),
        embeddingModel: z.string().optional(),
        sort: z.enum(["newest", "oldest", "chunks", "alpha"]).default("newest"),
        page: z.number().int().min(1).default(1),
        pageSize: z.number().int().min(1).max(100).default(10),
      })
      .parse(d ?? {}),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    let q = context.supabase.from("knowledge_documents").select(DOC_COLS, { count: "exact" });

    if (data.search) q = q.ilike("title", `%${data.search}%`);
    if (data.category) q = q.eq("category", data.category);
    if (data.status) q = q.eq("status", data.status);
    if (data.source) q = q.eq("source", data.source);
    if (data.embeddingModel) q = q.eq("embedding_model", data.embeddingModel);

    if (data.sort === "newest") q = q.order("created_at", { ascending: false });
    else if (data.sort === "oldest") q = q.order("created_at", { ascending: true });
    else if (data.sort === "chunks") q = q.order("chunk_count", { ascending: false });
    else q = q.order("title", { ascending: true });

    const from = (data.page - 1) * data.pageSize;
    q = q.range(from, from + data.pageSize - 1);

    const { data: rows, count, error } = await q;
    if (error) throw new Error(error.message);
    return { rows: (rows ?? []) as DocumentRow[], total: count ?? 0 };
  });

// ---------------------------------------------------------------- get one
export const getDocument = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { data: doc, error } = await context.supabase
      .from("knowledge_documents")
      .select(DOC_COLS)
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return doc as DocumentRow | null;
  });

const metaSchema = z.object({
  title: z.string().trim().min(1).max(300),
  slug: z.string().trim().max(300).optional().nullable(),
  description: z.string().max(5000).optional().nullable(),
  category: z.string().max(120).optional().nullable(),
  source: z.string().max(120).optional(),
  source_url: z.string().max(1000).optional().nullable(),
  language: z.string().max(20).optional(),
  jurisdiction: z.string().max(120).optional().nullable(),
  state: z.string().max(120).optional().nullable(),
  author: z.string().max(200).optional().nullable(),
  visibility: z.string().max(40).optional(),
  last_verified_date: z.string().optional().nullable(),
  tags: z.array(z.string()).optional(),
  version: z.string().max(40).optional(),
  model_version: z.string().max(80).optional().nullable(),
  embedding_model: z.string().max(120).optional(),
  // production-grade RAG fields
  country: z.string().max(80).optional().nullable(),
  district: z.string().max(120).optional().nullable(),
  jurisdiction_type: z.string().max(80).optional().nullable(),
  content_trust_level: z
    .enum(["official", "verified", "reviewed", "draft", "community", "imported"])
    .optional(),
  review_frequency: z.string().max(40).optional().nullable(),
  next_review_date: z.string().optional().nullable(),
  review_status: z.enum(["up_to_date", "needs_review", "expired", "archived"]).optional(),
  change_log: z.string().max(5000).optional().nullable(),
});

// ---------------------------------------------------------------- create
export const createDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    metaSchema
      .extend({
        file_path: z.string().optional().nullable(),
        file_type: z.string().optional().nullable(),
        file_size: z.number().optional().nullable(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { data: row, error } = await context.supabase
      .from("knowledge_documents")
      .insert({
        ...data,
        tags: data.tags ?? [],
        uploaded_by: context.userId,
        status: "pending",
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: row.id as string };
  });

// ---------------------------------------------------------------- update
export const updateDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => metaSchema.extend({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { id, change_log, ...patch } = data;

    // Snapshot current version into history when a change log is supplied.
    if (change_log) {
      const { data: current } = await context.supabase
        .from("knowledge_documents")
        .select(DOC_COLS)
        .eq("id", id)
        .maybeSingle();
      if (current) {
        await context.supabase.from("document_versions").insert({
          document_id: id,
          version: current.version ?? "1.0",
          title: current.title,
          description: current.description,
          change_log,
          snapshot: current,
          created_by: context.userId,
          published_at: new Date().toISOString(),
        });
      }
    }

    const { error } = await context.supabase
      .from("knowledge_documents")
      .update({ ...patch, change_log: change_log ?? undefined })
      .eq("id", id);
    if (error) throw new Error(error.message);
    await logActivity(context, "document_updated", { document_id: id });
    return { ok: true };
  });

// ---------------------------------------------------------------- version history
export const listVersions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ documentId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { data: rows, error } = await context.supabase
      .from("document_versions")
      .select("id, version, title, change_log, published_at, created_at")
      .eq("document_id", data.documentId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const restoreVersion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ versionId: z.string().uuid(), documentId: z.string().uuid() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { data: ver, error } = await context.supabase
      .from("document_versions")
      .select("snapshot")
      .eq("id", data.versionId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!ver?.snapshot) throw new Error("Version snapshot not found");
    const s = ver.snapshot as Record<string, unknown>;
    const restorable = {
      title: s.title,
      description: s.description,
      category: s.category,
      source: s.source,
      source_url: s.source_url,
      jurisdiction: s.jurisdiction,
      state: s.state,
      content_trust_level: s.content_trust_level,
      tags: s.tags,
    };
    const { error: upErr } = await context.supabase
      .from("knowledge_documents")
      .update(restorable as never)
      .eq("id", data.documentId);
    if (upErr) throw new Error(upErr.message);
    await logActivity(context, "version_restored", {
      document_id: data.documentId,
      version_id: data.versionId,
    });
    return { ok: true };
  });


// ---------------------------------------------------------------- delete
export const deleteDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { data: doc } = await context.supabase
      .from("knowledge_documents")
      .select("file_path")
      .eq("id", data.id)
      .maybeSingle();
    if (doc?.file_path) {
      await context.supabase.storage.from("knowledge-base").remove([doc.file_path]);
    }
    const { error } = await context.supabase
      .from("knowledge_documents")
      .delete()
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------------------------------------------------------------- chunks
export const listChunks = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ documentId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { data: rows, error } = await context.supabase
      .from("rag_chunks")
      .select(
        "id, chunk_index, chunk_title, chunk_text, token_count, embedding_status, embedding_model, model_version, source_section, created_at",
      )
      .eq("document_id", data.documentId)
      .order("chunk_index", { ascending: true });
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const reEmbedChunk = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { data: chunk, error } = await context.supabase
      .from("rag_chunks")
      .select("id, chunk_text, embedding_model")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!chunk) throw new Error("Chunk not found");
    const model = chunk.embedding_model ?? "google/gemini-embedding-001";
    const [embedding] = await embedTexts([chunk.chunk_text], model);
    const { error: upErr } = await context.supabase
      .from("rag_chunks")
      .update({
        embedding: embedding ? toVectorLiteral(embedding) : null,
        embedding_status: embedding ? "embedded" : "pending",
        embedding_model: model,
        model_version: model,
      })
      .eq("id", data.id);
    if (upErr) throw new Error(upErr.message);
    return { ok: true };
  });

export const deleteChunk = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ id: z.string().uuid(), documentId: z.string().uuid() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase.from("rag_chunks").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    const { count } = await context.supabase
      .from("rag_chunks")
      .select("id", { count: "exact", head: true })
      .eq("document_id", data.documentId);
    await context.supabase
      .from("knowledge_documents")
      .update({ chunk_count: count ?? 0 })
      .eq("id", data.documentId);
    return { ok: true };
  });

// ---------------------------------------------------------------- categories
export const listKbCategories = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("knowledge_categories")
      .select("id, name, description, icon, color")
      .order("name", { ascending: true });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

// ---------------------------------------------------------------- process / ingest
export const processDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        rawText: z.string().optional(),
        reEmbedOnly: z.boolean().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const sb = context.supabase;

    const { data: doc, error: docErr } = await sb
      .from("knowledge_documents")
      .select("id, file_path, file_type, embedding_model, description, category, content_trust_level")
      .eq("id", data.id)
      .maybeSingle();
    if (docErr) throw new Error(docErr.message);
    if (!doc) throw new Error("Document not found");

    const { data: job } = await sb
      .from("ingestion_jobs")
      .insert({ document_id: data.id, status: "running", started_at: new Date().toISOString() })
      .select("id")
      .single();

    await sb.from("knowledge_documents").update({ status: "processing" }).eq("id", data.id);

    try {
      // Resolve text source
      let text = data.rawText?.trim() ?? "";
      let fileHash: string | null = null;
      if (!text && doc.file_path) {
        const { data: blob, error: dlErr } = await sb.storage
          .from("knowledge-base")
          .download(doc.file_path);
        if (dlErr) throw new Error(`Download failed: ${dlErr.message}`);
        const buffer = await blob.arrayBuffer();
        fileHash = await sha256Hex(buffer);
        text = extractText(doc.file_type ?? "", buffer);
      }
      if (!text) text = doc.description ?? "";
      if (!text.trim()) throw new Error("No extractable text found in document");

      const chunks = chunkText(text);
      if (!chunks.length) throw new Error("Chunking produced no segments");

      // Replace existing chunks
      await sb.from("rag_chunks").delete().eq("document_id", data.id);

      const model = doc.embedding_model ?? "google/gemini-embedding-001";
      const embeddings = await embedTexts(
        chunks.map((c) => c.text),
        model,
      );

      const chunkTypeVal = chunkTypeForCategory(doc.category);
      const rows = chunks.map((c, i) => {
        const quality = scoreChunk(c.text, c.tokenCount, Boolean(c.section));
        return {
          document_id: data.id,
          chunk_index: c.index,
          chunk_title: c.title,
          chunk_text: c.text,
          token_count: c.tokenCount,
          source_section: c.section,
          embedding: embeddings[i] ? toVectorLiteral(embeddings[i]) : null,
          embedding_status: embeddings[i] ? "embedded" : "pending",
          embedding_model: model,
          model_version: model,
          quality_score: quality,
          confidence_score: quality,
          chunk_type: chunkTypeVal,
          chunk_status: "active",
          metadata: { source_table: "knowledge_documents", source_id: data.id },
        };
      });

      const { error: insErr } = await sb.from("rag_chunks").insert(rows as never);
      if (insErr) throw new Error(insErr.message);

      await sb
        .from("knowledge_documents")
        .update({
          status: "processed",
          chunk_count: rows.length,
          last_processed_at: new Date().toISOString(),
          model_version: model,
          file_hash: fileHash ?? undefined,
          sha256: fileHash ?? undefined,
        })
        .eq("id", data.id);

      if (job?.id) {
        await sb
          .from("ingestion_jobs")
          .update({ status: "completed", completed_at: new Date().toISOString() })
          .eq("id", job.id);
      }

      return { ok: true, chunks: rows.length };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Processing failed";
      await sb.from("knowledge_documents").update({ status: "failed" }).eq("id", data.id);
      if (job?.id) {
        await sb
          .from("ingestion_jobs")
          .update({
            status: "failed",
            completed_at: new Date().toISOString(),
            error_message: message,
          })
          .eq("id", job.id);
      }
      throw new Error(message);
    }
  });

// ================================================================
// KNOWLEDGE SOURCES (citations per document)
// ================================================================
export type SourceRow = {
  id: string;
  document_id: string | null;
  source_title: string;
  source_url: string | null;
  official_authority: string | null;
  source_type: string;
  citation_text: string | null;
  last_verified_at: string | null;
};

const sourceSchema = z.object({
  id: z.string().uuid().optional(),
  document_id: z.string().uuid(),
  source_title: z.string().trim().min(1).max(300),
  source_url: z.string().max(1000).optional().nullable(),
  official_authority: z.string().max(200).optional().nullable(),
  source_type: z
    .enum([
      "official_government",
      "government_portal",
      "legal_authority",
      "court",
      "verified_source",
      "internal_content",
    ])
    .default("verified_source"),
  citation_text: z.string().max(2000).optional().nullable(),
  last_verified_at: z.string().optional().nullable(),
});

export const listSources = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ documentId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { data: rows, error } = await context.supabase
      .from("knowledge_sources")
      .select(
        "id, document_id, source_title, source_url, official_authority, source_type, citation_text, last_verified_at",
      )
      .eq("document_id", data.documentId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (rows ?? []) as SourceRow[];
  });

export const upsertSource = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => sourceSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const payload = {
      document_id: data.document_id,
      source_title: data.source_title,
      source_url: data.source_url ?? null,
      official_authority: data.official_authority ?? null,
      source_type: data.source_type,
      citation_text: data.citation_text ?? null,
      last_verified_at: data.last_verified_at || null,
      created_by: context.userId,
    };
    if (data.id) {
      const { error } = await context.supabase
        .from("knowledge_sources")
        .update(payload as never)
        .eq("id", data.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await context.supabase
        .from("knowledge_sources")
        .insert(payload as never);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const deleteSource = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase
      .from("knowledge_sources")
      .delete()
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ================================================================
// REVIEW QUEUE — documents needing verification
// ================================================================
export const reviewQueue = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const sb = context.supabase;
    const today = new Date().toISOString().slice(0, 10);
    const { data: rows } = await sb
      .from("knowledge_documents")
      .select("id, title, review_status, next_review_date, content_trust_level, last_verified_date")
      .or(`review_status.eq.needs_review,review_status.eq.expired,next_review_date.lte.${today}`)
      .order("next_review_date", { ascending: true })
      .limit(50);
    const { count } = await sb
      .from("knowledge_documents")
      .select("id", { count: "exact", head: true })
      .or(`review_status.eq.needs_review,review_status.eq.expired,next_review_date.lte.${today}`);
    return { rows: rows ?? [], count: count ?? 0 };
  });

// ================================================================
// CHUNK QUALITY DASHBOARD
// ================================================================
export const chunkQualityStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const sb = context.supabase;
    const { data: rows } = await sb
      .from("rag_chunks")
      .select("id, token_count, quality_score, confidence_score, chunk_text, chunk_title")
      .limit(5000);
    const list = rows ?? [];
    const total = list.length;
    const avg = (key: "quality_score" | "confidence_score") =>
      total
        ? Number(
            (list.reduce((s: number, c: any) => s + (Number(c[key]) || 0), 0) / total).toFixed(2),
          )
        : 0;
    const lowQuality = list.filter((c: any) => (Number(c.quality_score) || 0) < 0.4).length;
    const sortedBig = [...list].sort((a: any, b: any) => (b.token_count || 0) - (a.token_count || 0));
    const sortedSmall = [...list].sort(
      (a: any, b: any) => (a.token_count || 0) - (b.token_count || 0),
    );
    return {
      total,
      avgQuality: avg("quality_score"),
      avgConfidence: avg("confidence_score"),
      lowQuality,
      largest: sortedBig.slice(0, 5).map((c: any) => ({
        id: c.id,
        title: c.chunk_title,
        tokens: c.token_count,
      })),
      smallest: sortedSmall.slice(0, 5).map((c: any) => ({
        id: c.id,
        title: c.chunk_title,
        tokens: c.token_count,
      })),
    };
  });

// ================================================================
// RETRIEVAL ANALYTICS
// ================================================================
export const retrievalAnalytics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const sb = context.supabase;
    const { data: logs } = await sb
      .from("retrieval_logs")
      .select(
        "id, query, retrieved_chunk_ids, retrieval_time_ms, response_time_ms, model_used, confidence_score, succeeded, created_at",
      )
      .order("created_at", { ascending: false })
      .limit(2000);
    const list = logs ?? [];
    const total = list.length;
    const avg = (key: "retrieval_time_ms" | "response_time_ms") =>
      total
        ? Math.round(list.reduce((s: number, l: any) => s + (Number(l[key]) || 0), 0) / total)
        : 0;

    const queryCounts: Record<string, number> = {};
    const failed: { query: string; created_at: string }[] = [];
    for (const l of list) {
      const q = (l.query || "").trim().slice(0, 120);
      if (q) queryCounts[q] = (queryCounts[q] || 0) + 1;
      if (!l.succeeded) failed.push({ query: l.query, created_at: l.created_at });
    }
    const topQuestions = Object.entries(queryCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([query, count]) => ({ query, count }));

    return {
      total,
      avgRetrievalMs: avg("retrieval_time_ms"),
      avgResponseMs: avg("response_time_ms"),
      failedCount: failed.length,
      topQuestions,
      failedQueries: failed.slice(0, 10),
      recent: list.slice(0, 20).map((l: any) => ({
        id: l.id,
        query: l.query,
        model: l.model_used,
        retrieval_time_ms: l.retrieval_time_ms,
        response_time_ms: l.response_time_ms,
        confidence_score: l.confidence_score,
        succeeded: l.succeeded,
        created_at: l.created_at,
      })),
    };
  });

// ================================================================
// EXTENDED KB ANALYTICS (trust, verification, feedback)
// ================================================================
export const kbAnalytics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const sb = context.supabase;
    const today = new Date().toISOString().slice(0, 10);

    const docCount = async (filter?: (q: any) => any) => {
      let q = sb.from("knowledge_documents").select("id", { count: "exact", head: true });
      if (filter) q = filter(q);
      const { count } = await q;
      return count ?? 0;
    };

    const [
      totalDocs,
      officialSources,
      verifiedSources,
      pendingReviews,
      totalChunks,
      failedJobs,
    ] = await Promise.all([
      docCount(),
      docCount((q) => q.eq("content_trust_level", "official")),
      docCount((q) => q.eq("content_trust_level", "verified")),
      docCount((q) =>
        q.or(`review_status.eq.needs_review,review_status.eq.expired,next_review_date.lte.${today}`),
      ),
      (async () => {
        const { count } = await sb.from("rag_chunks").select("id", { count: "exact", head: true });
        return count ?? 0;
      })(),
      (async () => {
        const { count } = await sb
          .from("ingestion_jobs")
          .select("id", { count: "exact", head: true })
          .eq("status", "failed");
        return count ?? 0;
      })(),
    ]);

    const { data: chunkConf } = await sb.from("rag_chunks").select("confidence_score").limit(5000);
    const confList = chunkConf ?? [];
    const avgConfidence = confList.length
      ? Number(
          (
            confList.reduce((s: number, c: any) => s + (Number(c.confidence_score) || 0), 0) /
            confList.length
          ).toFixed(2),
        )
      : 0;

    const { data: fb } = await sb.from("ai_feedback").select("rating").limit(5000);
    const fbList = fb ?? [];
    const positive = fbList.filter((f: any) => f.rating === "up").length;
    const avgFeedback = fbList.length ? Number((positive / fbList.length).toFixed(2)) : 0;

    return {
      totalDocs,
      totalChunks,
      officialSources,
      verifiedSources,
      pendingReviews,
      failedJobs,
      avgConfidence,
      avgFeedback,
      feedbackCount: fbList.length,
    };
  });

// ================================================================
// KNOWLEDGE HEALTH SCORE
// ================================================================
export const knowledgeHealth = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const sb = context.supabase;
    const today = new Date().toISOString().slice(0, 10);

    const docCount = async (filter?: (q: any) => any) => {
      let q = sb.from("knowledge_documents").select("id", { count: "exact", head: true });
      if (filter) q = filter(q);
      const { count } = await q;
      return count ?? 0;
    };

    const [totalDocs, withSourceUrl, verified, upToDate] = await Promise.all([
      docCount(),
      docCount((q) => q.not("source_url", "is", null)),
      docCount((q) =>
        q.or("content_trust_level.eq.official,content_trust_level.eq.verified"),
      ),
      docCount((q) => q.eq("review_status", "up_to_date").lte("next_review_date", today).not("next_review_date", "is", null)),
    ]);

    const { count: totalChunks } = await sb
      .from("rag_chunks")
      .select("id", { count: "exact", head: true });
    const { count: embeddedChunks } = await sb
      .from("rag_chunks")
      .select("id", { count: "exact", head: true })
      .eq("embedding_status", "embedded");
    const { count: officialSources } = await sb
      .from("knowledge_sources")
      .select("id", { count: "exact", head: true })
      .in("source_type", ["official_government", "government_portal", "legal_authority", "court"]);

    const { data: fb } = await sb.from("ai_feedback").select("rating").limit(5000);
    const fbList = fb ?? [];
    const positive = fbList.filter((f: any) => f.rating === "up").length;
    const feedbackScore = fbList.length ? positive / fbList.length : 1;

    const verificationCoverage = totalDocs ? withSourceUrl / totalDocs : 0;
    const trustCoverage = totalDocs ? verified / totalDocs : 0;
    const embedCoverage = totalChunks ? (embeddedChunks ?? 0) / totalChunks : 0;

    // overall 0-100 score
    const score = Math.round(
      (verificationCoverage * 0.25 +
        trustCoverage * 0.3 +
        embedCoverage * 0.25 +
        feedbackScore * 0.2) *
        100,
    );

    return {
      score,
      totalDocs,
      totalChunks: totalChunks ?? 0,
      officialSources: officialSources ?? 0,
      verificationCoverage: Number((verificationCoverage * 100).toFixed(0)),
      trustCoverage: Number((trustCoverage * 100).toFixed(0)),
      embedCoverage: Number((embedCoverage * 100).toFixed(0)),
      feedbackScore: Number((feedbackScore * 100).toFixed(0)),
      feedbackCount: fbList.length,
    };
  });

