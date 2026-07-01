import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  chunkText,
  chunkTypeForCategory,
  embedTexts,
  scoreChunk,
  toVectorLiteral,
} from "@/lib/kb.server";

const EMBEDDING_MODEL = "google/gemini-embedding-001";

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

export type SyncType =
  | "government_services"
  | "legal_topics"
  | "faqs"
  | "schemes"
  | "complaint_templates"
  | "glossary";

export const SYNC_TYPES: {
  type: SyncType;
  label: string;
  table: string;
  category: string;
}[] = [
  { type: "government_services", label: "Government Services", table: "government_services", category: "Government Services" },
  { type: "legal_topics", label: "Legal Topics", table: "legal_topics", category: "Legal Rights" },
  { type: "faqs", label: "FAQs", table: "faqs", category: "FAQ" },
  { type: "schemes", label: "Schemes", table: "schemes", category: "Government Schemes" },
  { type: "complaint_templates", label: "Complaint Templates", table: "complaint_templates", category: "Templates" },
  { type: "glossary", label: "Glossary", table: "glossary", category: "Glossary" },
];

const syncTypeSchema = z.enum([
  "government_services",
  "legal_topics",
  "faqs",
  "schemes",
  "complaint_templates",
  "glossary",
]);

function docSlug(type: SyncType, id: string) {
  return `cms:${type}:${id}`;
}

function line(label: string, value: unknown): string {
  if (value === null || value === undefined) return "";
  const str = typeof value === "string" ? value.trim() : String(value);
  if (!str) return "";
  return `## ${label}\n${str}\n`;
}

function jsonArrayToText(value: unknown): string {
  if (!value) return "";
  try {
    const arr = Array.isArray(value) ? value : JSON.parse(String(value));
    if (!Array.isArray(arr)) return String(value);
    return arr
      .map((item) => {
        if (item && typeof item === "object") {
          return Object.entries(item as Record<string, unknown>)
            .map(([k, v]) => `${k}: ${v}`)
            .join(" — ");
        }
        return String(item);
      })
      .join("\n");
  } catch {
    return String(value);
  }
}

// ---------------------------------------------------------------- compose
async function composeDoc(
  sb: any,
  type: SyncType,
  id: string,
): Promise<{ title: string; category: string; text: string } | null> {
  const cfg = SYNC_TYPES.find((t) => t.type === type)!;

  if (type === "government_services") {
    const { data: svc } = await sb.from("government_services").select("*").eq("id", id).maybeSingle();
    if (!svc) return null;
    const { data: docs } = await sb
      .from("required_documents")
      .select("document_name")
      .eq("service_id", id);
    const { data: steps } = await sb
      .from("procedures")
      .select("step_number, title, description")
      .eq("service_id", id)
      .order("step_number", { ascending: true });
    const reqDocs = (docs ?? []).map((d: any) => `- ${d.document_name}`).join("\n");
    const procedure = (steps ?? [])
      .map((s: any) => `${s.step_number}. ${s.title}${s.description ? `: ${s.description}` : ""}`)
      .join("\n");
    const text =
      `# ${svc.title}\n` +
      line("Category", svc.category) +
      line("Overview", svc.description) +
      line("Eligibility", svc.eligibility) +
      line("Fees", svc.fees) +
      line("Processing Time", svc.processing_time) +
      (reqDocs ? `## Required Documents\n${reqDocs}\n` : "") +
      (procedure ? `## Procedure\n${procedure}\n` : "");
    return { title: svc.title, category: cfg.category, text };
  }

  if (type === "legal_topics") {
    const { data: t } = await sb.from("legal_topics").select("*").eq("id", id).maybeSingle();
    if (!t) return null;
    const text =
      `# ${t.title}\n` +
      line("Category", t.category) +
      line("Description", t.description) +
      line("Overview", t.overview) +
      line("Procedure", t.procedure) +
      (t.documents ? `## Documents\n${jsonArrayToText(t.documents)}\n` : "") +
      (t.faq ? `## FAQs\n${jsonArrayToText(t.faq)}\n` : "") +
      (t.related ? `## Related\n${jsonArrayToText(t.related)}\n` : "");
    return { title: t.title, category: cfg.category, text };
  }

  if (type === "faqs") {
    const { data: f } = await sb.from("faqs").select("*").eq("id", id).maybeSingle();
    if (!f) return null;
    const text =
      `# ${f.question}\n` +
      line("Category", f.category) +
      line("Answer", f.answer) +
      line("Jurisdiction", f.jurisdiction);
    return { title: f.question, category: cfg.category, text };
  }

  if (type === "schemes") {
    const { data: s } = await sb.from("schemes").select("*").eq("id", id).maybeSingle();
    if (!s) return null;
    const text =
      `# ${s.title}\n` +
      line("Category", s.category) +
      line("Jurisdiction", s.jurisdiction) +
      line("Description", s.description) +
      line("Eligibility", s.eligibility) +
      line("Benefits", s.benefits) +
      line("Application Process", s.application_process);
    return { title: s.title, category: cfg.category, text };
  }

  if (type === "complaint_templates") {
    const { data: c } = await sb.from("complaint_templates").select("*").eq("id", id).maybeSingle();
    if (!c) return null;
    const text =
      `# ${c.title}\n` +
      line("Type", c.type) +
      line("Jurisdiction", c.jurisdiction) +
      line("Description", c.description) +
      line("Template", c.template_body);
    return { title: c.title, category: cfg.category, text };
  }

  if (type === "glossary") {
    const { data: g } = await sb.from("glossary").select("*").eq("id", id).maybeSingle();
    if (!g) return null;
    const text = `# ${g.term}\n` + line("Category", g.category) + line("Definition", g.definition);
    return { title: g.term, category: cfg.category, text };
  }

  return null;
}

function recordTitle(type: SyncType, row: any): string {
  if (type === "faqs") return row.question;
  if (type === "glossary") return row.term;
  return row.title;
}

// ---------------------------------------------------------------- overview
export const kbSyncOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const sb = context.supabase;

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
    const sb = context.supabase;
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
    const sb = context.supabase;
    const slug = docSlug(data.type, data.id);

    const composed = await composeDoc(sb, data.type, data.id);
    if (!composed || !composed.text.trim()) {
      throw new Error("Source record not found or has no content");
    }

    // Find or create the knowledge_document (never duplicate).
    const { data: existing } = await sb
      .from("knowledge_documents")
      .select("id")
      .eq("slug", slug)
      .eq("source", "cms_sync")
      .maybeSingle();

    let documentId = existing?.id as string | undefined;
    const docPayload = {
      title: composed.title,
      slug,
      description: composed.text,
      category: composed.category,
      source: "cms_sync",
      language: "en",
      jurisdiction: "India",
      status: "processing",
      content_trust_level: "verified",
      embedding_model: EMBEDDING_MODEL,
      is_latest: true,
      visibility: "internal",
      uploaded_by: context.userId,
    };

    if (documentId) {
      await sb.from("knowledge_documents").update(docPayload).eq("id", documentId);
    } else {
      const { data: row, error } = await sb
        .from("knowledge_documents")
        .insert(docPayload)
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      documentId = row.id as string;
    }

    const { data: job } = await sb
      .from("ingestion_jobs")
      .insert({ document_id: documentId, status: "running", started_at: new Date().toISOString() })
      .select("id")
      .single();

    try {
      const chunks = chunkText(composed.text);
      if (!chunks.length) throw new Error("Chunking produced no segments");

      // Replace existing chunks with fresh embeddings.
      await sb.from("rag_chunks").delete().eq("document_id", documentId);

      const embeddings = await embedTexts(
        chunks.map((c) => c.text),
        EMBEDDING_MODEL,
      );
      const chunkTypeVal = chunkTypeForCategory(composed.category);

      const rows = chunks.map((c, i) => {
        const quality = scoreChunk(c.text, c.tokenCount, Boolean(c.section));
        return {
          document_id: documentId,
          chunk_index: c.index,
          chunk_title: c.title,
          chunk_text: c.text,
          token_count: c.tokenCount,
          source_section: c.section,
          embedding: embeddings[i] ? toVectorLiteral(embeddings[i]) : null,
          embedding_status: embeddings[i] ? "embedded" : "pending",
          embedding_model: EMBEDDING_MODEL,
          model_version: EMBEDDING_MODEL,
          quality_score: quality,
          confidence_score: quality,
          chunk_type: chunkTypeVal,
          chunk_status: "active",
          metadata: { source_table: data.type, source_id: data.id },
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
          model_version: EMBEDDING_MODEL,
          published_at: new Date().toISOString(),
        })
        .eq("id", documentId);

      if (job?.id) {
        await sb
          .from("ingestion_jobs")
          .update({ status: "completed", completed_at: new Date().toISOString() })
          .eq("id", job.id);
      }

      await logActivity(context, "kb_sync_record", {
        type: data.type,
        record_id: data.id,
        document_id: documentId,
        chunks: rows.length,
      });

      return { ok: true, documentId, chunks: rows.length, status: "processed" as const };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Sync failed";
      await sb.from("knowledge_documents").update({ status: "failed" }).eq("id", documentId);
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

// ---------------------------------------------------------------- rebuild embeddings
export const rebuildEmbeddings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ documentId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const sb = context.supabase;

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
    const sb = context.supabase;
    await sb.from("rag_chunks").delete().eq("document_id", data.documentId);
    const { error } = await sb.from("knowledge_documents").delete().eq("id", data.documentId);
    if (error) throw new Error(error.message);
    await logActivity(context, "kb_delete_document", { document_id: data.documentId });
    return { ok: true };
  });
