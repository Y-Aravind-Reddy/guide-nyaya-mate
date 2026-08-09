// Shared server-only Knowledge Base sync engine.
// Reused by the admin sync server functions and the automatic CMS->KB webhook.
import {
  chunkText,
  chunkTypeForCategory,
  embedTexts,
  scoreChunk,
  toVectorLiteral,
} from "@/lib/kb.server";

export const EMBEDDING_MODEL = "google/gemini-embedding-001";

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

export function docSlug(type: SyncType, id: string) {
  return `cms:${type}:${id}`;
}

export function recordTitle(type: SyncType, row: any): string {
  if (type === "faqs") return row.question;
  if (type === "glossary") return row.term;
  return row.title;
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

/** Markdown block describing the official government source behind a record. */
async function sourceBlock(sb: any, sourceId: string | null | undefined): Promise<string> {
  if (!sourceId) return "";
  const { data: s } = await sb
    .from("official_sources")
    .select(
      "title, authority, department, ministry, state, government_level, source_url, apply_online_url, forms_url, track_status_url, appointment_url, complaint_url, helpline, email, last_verified_at",
    )
    .eq("id", sourceId)
    .maybeSingle();
  if (!s) return "";
  const rows = [
    ["Authority", s.authority],
    ["Department", s.department],
    ["Ministry", s.ministry],
    ["Government level", s.government_level],
    ["State", s.state],
    ["Official website", s.source_url],
    ["Apply online", s.apply_online_url],
    ["Forms & downloads", s.forms_url],
    ["Track application", s.track_status_url],
    ["Book appointment", s.appointment_url],
    ["File a complaint", s.complaint_url],
    ["Helpline", s.helpline],
    ["Email", s.email],
    [
      "Last verified",
      s.last_verified_at ? new Date(s.last_verified_at).toISOString().slice(0, 10) : null,
    ],
  ].filter(([, v]) => v);
  if (!rows.length) return "";
  return (
    `## Official Source\n${s.title ?? ""}\n` +
    rows.map(([k, v]) => `- ${k}: ${v}`).join("\n") +
    "\n"
  );
}

export async function composeDoc(
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

async function embedWithRetry(texts: string[], attempts = 3): Promise<number[][]> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await embedTexts(texts, EMBEDDING_MODEL);
    } catch (e) {
      lastErr = e;
      await new Promise((r) => setTimeout(r, 500 * (i + 1)));
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("Embedding failed");
}

/**
 * Ingest a single CMS record into the Knowledge Base:
 * compose -> upsert document -> chunk -> embed (with retry) -> swap chunks.
 * Old chunks are only replaced AFTER embeddings succeed, so the previous
 * published version stays active if embedding generation fails.
 */
export async function ingestCmsRecord(
  sb: any,
  type: SyncType,
  id: string,
  uploadedBy?: string | null,
): Promise<{ ok: true; documentId: string; chunks: number }> {
  const slug = docSlug(type, id);
  const composed = await composeDoc(sb, type, id);
  if (!composed || !composed.text.trim()) {
    throw new Error("Source record not found or has no content");
  }

  const { data: existing } = await sb
    .from("knowledge_documents")
    .select("id")
    .eq("slug", slug)
    .eq("source", "cms_sync")
    .maybeSingle();

  let documentId = existing?.id as string | undefined;
  const docPayload: Record<string, unknown> = {
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
  };
  if (uploadedBy) docPayload.uploaded_by = uploadedBy;

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

    // Embed first — if this fails, existing chunks remain untouched.
    const embeddings = await embedWithRetry(chunks.map((c) => c.text));
    const chunkTypeVal = chunkTypeForCategory(composed.category);

    // Only now replace old chunks.
    await sb.from("rag_chunks").delete().eq("document_id", documentId);

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
        metadata: { source_table: type, source_id: id },
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

    return { ok: true, documentId, chunks: rows.length };
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
}

/** Remove a CMS-synced document and its chunks from the Knowledge Base. */
export async function removeCmsDocument(
  sb: any,
  type: SyncType,
  id: string,
): Promise<{ ok: true }> {
  const slug = docSlug(type, id);
  const { data: doc } = await sb
    .from("knowledge_documents")
    .select("id")
    .eq("slug", slug)
    .eq("source", "cms_sync")
    .maybeSingle();
  if (!doc?.id) return { ok: true };
  await sb.from("rag_chunks").delete().eq("document_id", doc.id);
  await sb.from("knowledge_documents").delete().eq("id", doc.id);
  return { ok: true };
}
