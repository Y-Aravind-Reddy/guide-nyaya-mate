import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// ---------------------------------------------------------------- helpers
async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden: admin access required");
}

const isEmpty = (v: unknown) =>
  v == null ||
  (typeof v === "string" && v.trim() === "") ||
  (Array.isArray(v) && v.length === 0);

const jsonLen = (v: unknown): number => {
  if (Array.isArray(v)) return v.length;
  if (typeof v === "string") {
    try {
      const a = JSON.parse(v);
      return Array.isArray(a) ? a.length : 0;
    } catch {
      return 0;
    }
  }
  return 0;
};

const pct = (part: number, total: number) => (total ? Math.round((part / total) * 100) : 0);
const norm = (s: unknown) => (typeof s === "string" ? s.toLowerCase().replace(/\s+/g, " ").trim() : "");

// ================================================================
// PART 1 — CONTENT QUALITY SCANNER
// ================================================================
type QCheck = { label: string; ok: boolean };
type QRecord = {
  id: string;
  type: string;
  typeLabel: string;
  title: string;
  quality: number;
  completeness: number;
  trust: number;
  issues: string[];
};

export const contentQualityScan = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const sb = context.supabase;

    const [gs, lt, sc, fq, gl, reqDocs, procs, sources] = await Promise.all([
      sb.from("government_services").select("id, title, slug, description, category, eligibility, fees, processing_time, source_id"),
      sb.from("legal_topics").select("id, title, slug, description, overview, procedure, documents, faq, related, source_id"),
      sb.from("schemes").select("id, title, slug, description, eligibility, benefits, application_process, source_id"),
      sb.from("faqs").select("id, question, answer, category, source_id"),
      sb.from("glossary").select("id, term, definition, category, source_id"),
      sb.from("required_documents").select("service_id"),
      sb.from("procedures").select("service_id"),
      sb.from("official_sources").select("id, status, is_active, link_status"),
    ]);

    const docCount = new Map<string, number>();
    for (const r of reqDocs.data ?? []) docCount.set(r.service_id, (docCount.get(r.service_id) ?? 0) + 1);
    const procCount = new Map<string, number>();
    for (const r of procs.data ?? []) procCount.set(r.service_id, (procCount.get(r.service_id) ?? 0) + 1);
    const srcMap = new Map<string, any>();
    for (const s of sources.data ?? []) srcMap.set(s.id, s);

    // trust from the linked official source
    const trustOf = (sourceId: string | null): number => {
      if (!sourceId) return 20;
      const s = srcMap.get(sourceId);
      if (!s) return 30;
      let t = 60;
      if (s.status === "verified") t += 25;
      if (s.is_active) t += 5;
      if (s.link_status === "healthy") t += 10;
      else if (s.link_status === "broken") t -= 25;
      return Math.max(0, Math.min(100, t));
    };
    const sourceBroken = (sourceId: string | null) =>
      sourceId != null && srcMap.get(sourceId)?.link_status === "broken";

    const issueCounts: Record<string, number> = {};
    const bump = (labels: string[]) => labels.forEach((l) => (issueCounts[l] = (issueCounts[l] ?? 0) + 1));

    const buildType = (
      key: string,
      label: string,
      rows: any[],
      titleField: string,
      checker: (r: any) => QCheck[],
    ) => {
      // duplicate detection by normalized title within type
      const seen = new Map<string, number>();
      for (const r of rows) {
        const k = norm(r[titleField]);
        if (k) seen.set(k, (seen.get(k) ?? 0) + 1);
      }
      const records: QRecord[] = rows.map((r) => {
        const checks = checker(r);
        const dup = (seen.get(norm(r[titleField])) ?? 0) > 1;
        if (dup) checks.push({ label: "Duplicate Content", ok: false });
        const brokenLink = sourceBroken(r.source_id);
        if (brokenLink) checks.push({ label: "Broken Official Link", ok: false });
        const passed = checks.filter((c) => c.ok).length;
        const completeness = pct(passed, checks.length);
        const trust = trustOf(r.source_id);
        const issues = checks.filter((c) => !c.ok).map((c) => c.label);
        bump(issues);
        const quality = Math.round(completeness * 0.6 + trust * 0.4);
        return {
          id: r.id,
          type: key,
          typeLabel: label,
          title: r[titleField] ?? "(untitled)",
          quality,
          completeness,
          trust,
          issues,
        };
      });
      const avgQuality = records.length
        ? Math.round(records.reduce((s, x) => s + x.quality, 0) / records.length)
        : 0;
      return { key, label, count: records.length, avgQuality, records };
    };

    const types = [
      buildType("government_services", "Government Services", gs.data ?? [], "title", (r) => [
        { label: "Missing Overview", ok: !isEmpty(r.description) },
        { label: "Missing Eligibility", ok: !isEmpty(r.eligibility) },
        { label: "Missing Fees", ok: !isEmpty(r.fees) },
        { label: "Missing Processing Time", ok: !isEmpty(r.processing_time) },
        { label: "Missing Required Documents", ok: (docCount.get(r.id) ?? 0) > 0 },
        { label: "Missing Procedures", ok: (procCount.get(r.id) ?? 0) > 0 },
        { label: "Missing Official Sources", ok: !isEmpty(r.source_id) },
        { label: "Missing SEO Metadata", ok: !isEmpty(r.slug) && !isEmpty(r.description) },
      ]),
      buildType("legal_topics", "Legal Topics", lt.data ?? [], "title", (r) => [
        { label: "Missing Overview", ok: !isEmpty(r.overview) || !isEmpty(r.description) },
        { label: "Missing Procedures", ok: !isEmpty(r.procedure) },
        { label: "Missing Required Documents", ok: jsonLen(r.documents) > 0 },
        { label: "Missing FAQs", ok: jsonLen(r.faq) > 0 },
        { label: "Missing Related Services", ok: jsonLen(r.related) > 0 },
        { label: "Missing Official Sources", ok: !isEmpty(r.source_id) },
        { label: "Missing SEO Metadata", ok: !isEmpty(r.slug) && !isEmpty(r.description) },
      ]),
      buildType("schemes", "Schemes", sc.data ?? [], "title", (r) => [
        { label: "Missing Overview", ok: !isEmpty(r.description) },
        { label: "Missing Eligibility", ok: !isEmpty(r.eligibility) },
        { label: "Missing Benefits", ok: !isEmpty(r.benefits) },
        { label: "Missing Procedures", ok: !isEmpty(r.application_process) },
        { label: "Missing Official Sources", ok: !isEmpty(r.source_id) },
        { label: "Missing SEO Metadata", ok: !isEmpty(r.slug) },
      ]),
      buildType("faqs", "FAQs", fq.data ?? [], "question", (r) => [
        { label: "Missing Overview", ok: !isEmpty(r.answer) },
        { label: "Missing SEO Metadata", ok: !isEmpty(r.category) },
        { label: "Missing Official Sources", ok: !isEmpty(r.source_id) },
      ]),
      buildType("glossary", "Glossary", gl.data ?? [], "term", (r) => [
        { label: "Missing Overview", ok: !isEmpty(r.definition) },
        { label: "Missing SEO Metadata", ok: !isEmpty(r.category) },
        { label: "Missing Official Sources", ok: !isEmpty(r.source_id) },
      ]),
    ];

    const allRecords = types.flatMap((t) => t.records);
    const total = allRecords.length;
    const avg = (sel: (r: QRecord) => number) =>
      total ? Math.round(allRecords.reduce((s, r) => s + sel(r), 0) / total) : 0;

    // worst records across all types (lowest quality first)
    const worst = [...allRecords].sort((a, b) => a.quality - b.quality).slice(0, 40);

    return {
      summary: {
        totalRecords: total,
        avgQuality: avg((r) => r.quality),
        avgCompleteness: avg((r) => r.completeness),
        avgTrust: avg((r) => r.trust),
        issueCounts,
      },
      types: types.map((t) => ({ key: t.key, label: t.label, count: t.count, avgQuality: t.avgQuality })),
      worst,
    };
  });

// ================================================================
// PART 2 — AI COVERAGE ANALYZER
// ================================================================
const CMS_TYPES: { type: string; table: string; label: string; titleField: string }[] = [
  { type: "government_services", table: "government_services", label: "Government Services", titleField: "title" },
  { type: "legal_topics", table: "legal_topics", label: "Legal Topics", titleField: "title" },
  { type: "schemes", table: "schemes", label: "Schemes", titleField: "title" },
  { type: "faqs", table: "faqs", label: "FAQs", titleField: "question" },
  { type: "glossary", table: "glossary", label: "Glossary", titleField: "term" },
];

export const aiCoverageReport = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const sb = context.supabase;

    // KB docs synced from CMS
    const { data: docs } = await sb
      .from("knowledge_documents")
      .select("slug, status, chunk_count")
      .eq("source", "cms_sync")
      .limit(10000);
    const docBySlug = new Map<string, any>();
    for (const d of docs ?? []) docBySlug.set(String(d.slug), d);

    const missingKb: { type: string; label: string; items: { id: string; title: string }[] }[] = [];
    const missingEmbeddings: { type: string; label: string; items: { id: string; title: string }[] }[] = [];
    let totalCmsRecords = 0;
    let syncedCount = 0;

    const cmsRows = await Promise.all(
      CMS_TYPES.map((c) => (sb as any).from(c.table).select(`id, ${c.titleField}`).limit(10000)),
    );

    CMS_TYPES.forEach((c, i) => {
      const rows: any[] = cmsRows[i].data ?? [];
      totalCmsRecords += rows.length;
      const noKb: { id: string; title: string }[] = [];
      const noEmb: { id: string; title: string }[] = [];
      for (const r of rows) {
        const slug = `cms:${c.type}:${r.id}`;
        const doc = docBySlug.get(slug);
        const title = (r as any)[c.titleField] ?? "(untitled)";
        if (!doc) {
          noKb.push({ id: r.id, title });
        } else {
          syncedCount++;
          if (doc.status !== "processed" || !doc.chunk_count) noEmb.push({ id: r.id, title });
        }
      }
      if (noKb.length) missingKb.push({ type: c.type, label: c.label, items: noKb.slice(0, 25) });
      if (noEmb.length) missingEmbeddings.push({ type: c.type, label: c.label, items: noEmb.slice(0, 25) });
    });

    // Retrieval signals
    const { data: logs } = await sb
      .from("retrieval_logs")
      .select("query, succeeded, confidence_score, retrieved_chunk_ids, created_at")
      .order("created_at", { ascending: false })
      .limit(4000);
    const logRows = logs ?? [];

    const agg = (
      rows: any[],
      valueOf?: (r: any) => number,
    ): { label: string; value: number; conf?: number }[] => {
      const m = new Map<string, { count: number; confSum: number }>();
      for (const r of rows) {
        const q = norm(r.query).slice(0, 120);
        if (!q) continue;
        const e = m.get(q) ?? { count: 0, confSum: 0 };
        e.count += 1;
        e.confSum += Number(r.confidence_score ?? 0);
        m.set(q, e);
      }
      return [...m.entries()]
        .map(([label, e]) => ({ label, value: e.count, conf: Math.round((e.confSum / e.count) * 100) }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 15);
    };

    const unansweredRows = logRows.filter((l: any) => !l.succeeded);
    const lowConfRows = logRows.filter(
      (l: any) => l.succeeded && Number(l.confidence_score ?? 0) > 0 && Number(l.confidence_score) < 0.5,
    );
    const lowCitationRows = logRows.filter(
      (l: any) => !l.retrieved_chunk_ids || l.retrieved_chunk_ids.length === 0,
    );

    const unanswered = agg(unansweredRows);
    const lowConfidence = agg(lowConfRows);

    // Top missing knowledge areas = union of unanswered + low confidence, weighted
    const gapMap = new Map<string, number>();
    for (const u of unanswered) gapMap.set(u.label, (gapMap.get(u.label) ?? 0) + u.value * 2);
    for (const u of lowConfidence) gapMap.set(u.label, (gapMap.get(u.label) ?? 0) + u.value);
    const topMissingAreas = [...gapMap.entries()]
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 12);

    const totalQueries = logRows.length;
    const coverageRate = pct(syncedCount, totalCmsRecords);
    const answerRate = pct(logRows.filter((l: any) => l.succeeded).length, totalQueries);
    const citationCoverage = pct(totalQueries - lowCitationRows.length, totalQueries);

    return {
      totalCmsRecords,
      syncedCount,
      coverageRate,
      answerRate,
      citationCoverage,
      totalQueries,
      missingKbCount: missingKb.reduce((s, g) => s + g.items.length, 0),
      missingEmbeddingsCount: missingEmbeddings.reduce((s, g) => s + g.items.length, 0),
      lowCitationCount: lowCitationRows.length,
      missingKb,
      missingEmbeddings,
      unanswered,
      lowConfidence,
      topMissingAreas,
    };
  });

// ================================================================
// PART 3 — LINK VERIFICATION
// ================================================================



/**
 * Verify official-source links in a bounded, resumable batch.
 * Each URL result is persisted to `link_check_history`; the caller can keep
 * calling with the returned `nextOffset` until it is null.
 */
export const verifyOfficialLinks = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data?: { id?: string; offset?: number; limit?: number }) => data ?? {})
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { verifyLinkBatch } = await import("@/lib/link-check.server");
    const result = await verifyLinkBatch(context.supabase, {
      sourceId: data?.id,
      offset: data?.offset ?? 0,
      limit: data?.limit ?? 10,
    });
    return { ...result, checked: result.processed, checkedAt: new Date().toISOString() };
  });


export const linkStatusReport = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const sb = context.supabase;
    const { data: rows } = await sb
      .from("official_sources")
      .select(
        "id, title, authority, source_url, apply_online_url, forms_url, link_status, website_link_status, apply_link_status, forms_link_status, website_http_code, apply_http_code, forms_http_code, links_checked_at, last_verified_at",
      )
      .order("links_checked_at", { ascending: true, nullsFirst: true })
      .limit(500);

    const list = rows ?? [];
    const counts = { healthy: 0, broken: 0, redirected: 0, needs_review: 0, unchecked: 0 };
    for (const r of list) {
      if (!r.link_status) counts.unchecked++;
      else if (r.link_status in counts) (counts as any)[r.link_status]++;
      else counts.needs_review++;
    }
    const lastChecked =
      list.map((r) => r.links_checked_at).filter(Boolean).sort().slice(-1)[0] ?? null;

    return { total: list.length, counts, lastChecked, sources: list };
  });
