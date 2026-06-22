import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  chunkText,
  embedTexts,
  extractText,
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
};

const DOC_COLS =
  "id, title, slug, description, category, source, source_url, language, jurisdiction, state, author, visibility, last_verified_date, tags, version, model_version, embedding_model, status, file_path, file_type, file_size, chunk_count, last_processed_at, created_at, updated_at";

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
    const { id, ...patch } = data;
    const { error } = await context.supabase
      .from("knowledge_documents")
      .update(patch)
      .eq("id", id);
    if (error) throw new Error(error.message);
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
      .select("id, file_path, file_type, embedding_model, description")
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
      if (!text && doc.file_path) {
        const { data: blob, error: dlErr } = await sb.storage
          .from("knowledge-base")
          .download(doc.file_path);
        if (dlErr) throw new Error(`Download failed: ${dlErr.message}`);
        const buffer = await blob.arrayBuffer();
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

      const rows = chunks.map((c, i) => ({
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
        metadata: { source_table: "knowledge_documents", source_id: data.id },
      }));

      const { error: insErr } = await sb.from("rag_chunks").insert(rows);
      if (insErr) throw new Error(insErr.message);

      await sb
        .from("knowledge_documents")
        .update({
          status: "processed",
          chunk_count: rows.length,
          last_processed_at: new Date().toISOString(),
          model_version: model,
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
