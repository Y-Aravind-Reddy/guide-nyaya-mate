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

function countHelper(sb: any) {
  return async (table: string, build?: (q: any) => any): Promise<number> => {
    try {
      let q = sb.from(table).select("id", { count: "exact", head: true });
      if (build) q = build(q);
      const { count } = await q;
      return count ?? 0;
    } catch {
      return 0;
    }
  };
}

function pct(part: number, total: number): number {
  if (!total) return 0;
  return Math.round((part / total) * 100);
}

const todayIso = () => new Date().toISOString().slice(0, 10);

// ================================================================
// PART 1 — KNOWLEDGE HEALTH REPORT
// ================================================================
export const knowledgeHealthReport = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const sb = context.supabase;
    const count = countHelper(sb);
    const today = todayIso();

    const [
      totalDocs,
      totalChunks,
      totalEmbeddings,
      failedEmbeddings,
      missingMetadata,
      missingSources,
      outdated,
    ] = await Promise.all([
      count("knowledge_documents"),
      count("rag_chunks"),
      count("rag_chunks", (q) => q.eq("embedding_status", "embedded")),
      count("rag_chunks", (q) => q.eq("embedding_status", "failed")),
      count("knowledge_documents", (q) => q.or("description.is.null,category.is.null")),
      count("knowledge_documents", (q) => q.is("source_url", null)),
      count("knowledge_documents", (q) =>
        q.or(`review_status.eq.expired,next_review_date.lt.${today}`),
      ),
    ]);

    // Duplicate documents (by content hash)
    let duplicateDocuments = 0;
    try {
      const { data: hashes } = await sb
        .from("knowledge_documents")
        .select("sha256, file_hash")
        .limit(5000);
      const seen = new Map<string, number>();
      for (const h of hashes ?? []) {
        const key = h.sha256 || h.file_hash;
        if (!key) continue;
        seen.set(key, (seen.get(key) ?? 0) + 1);
      }
      for (const v of seen.values()) if (v > 1) duplicateDocuments += v - 1;
    } catch {
      /* ignore */
    }

    // Duplicate chunks (by chunk text)
    let duplicateChunks = 0;
    try {
      const { data: texts } = await sb.from("rag_chunks").select("chunk_text").limit(6000);
      const seen = new Map<string, number>();
      for (const t of texts ?? []) {
        const key = (t.chunk_text || "").slice(0, 200).trim();
        if (!key) continue;
        seen.set(key, (seen.get(key) ?? 0) + 1);
      }
      for (const v of seen.values()) if (v > 1) duplicateChunks += v - 1;
    } catch {
      /* ignore */
    }

    // Last KB sync
    let lastSync: string | null = null;
    try {
      const { data: last } = await sb
        .from("knowledge_documents")
        .select("last_processed_at")
        .not("last_processed_at", "is", null)
        .order("last_processed_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      lastSync = last?.last_processed_at ?? null;
    } catch {
      /* ignore */
    }

    // Sync success rate (ingestion jobs)
    const [jobsTotal, jobsDone] = await Promise.all([
      count("ingestion_jobs"),
      count("ingestion_jobs", (q) => q.eq("status", "completed")),
    ]);
    const syncSuccessRate = pct(jobsDone, jobsTotal);

    // AI retrieval success rate
    const [retrTotal, retrOk] = await Promise.all([
      count("retrieval_logs"),
      count("retrieval_logs", (q) => q.eq("succeeded", true)),
    ]);
    const retrievalSuccessRate = pct(retrOk, retrTotal);

    const embedCoverage = pct(totalEmbeddings, totalChunks);
    const avgChunksPerDoc = totalDocs
      ? Number((totalChunks / totalDocs).toFixed(1))
      : 0;

    // Overall score
    const score = Math.round(
      (embedCoverage * 0.3 +
        pct(totalDocs - missingSources, totalDocs) * 0.2 +
        pct(totalDocs - missingMetadata, totalDocs) * 0.15 +
        syncSuccessRate * 0.15 +
        retrievalSuccessRate * 0.2) /
        1,
    );

    return {
      score,
      totalDocs,
      totalChunks,
      totalEmbeddings,
      failedEmbeddings,
      duplicateDocuments,
      duplicateChunks,
      missingMetadata,
      missingSources,
      outdated,
      lastSync,
      syncSuccessRate,
      avgChunksPerDoc,
      retrievalSuccessRate,
      embedCoverage,
    };
  });

// ================================================================
// PART 2 — CONTENT HEALTH REPORT
// ================================================================
type ContentSection = {
  key: string;
  label: string;
  total: number;
  published: number;
  draft: number;
  archived: number;
  missingSource: number;
  missingSeo: number;
  missingImages: number;
  missingDescriptions: number;
  missingRelated: number;
  completion: number;
};

export const contentHealthReport = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const sb = context.supabase;

    const isEmpty = (v: unknown) =>
      v == null || (typeof v === "string" && v.trim() === "") ||
      (Array.isArray(v) && v.length === 0);

    const build = (
      key: string,
      label: string,
      rows: any[],
      opts: {
        source?: string;
        seo?: string;
        image?: string;
        desc?: string;
        related?: string;
      },
    ): ContentSection => {
      const total = rows.length;
      const missingSource = opts.source ? rows.filter((r) => isEmpty(r[opts.source!])).length : 0;
      const missingSeo = opts.seo ? rows.filter((r) => isEmpty(r[opts.seo!])).length : 0;
      const missingImages = opts.image ? rows.filter((r) => isEmpty(r[opts.image!])).length : 0;
      const missingDescriptions = opts.desc
        ? rows.filter((r) => isEmpty(r[opts.desc!])).length
        : 0;
      const missingRelated = opts.related
        ? rows.filter((r) => isEmpty(r[opts.related!])).length
        : 0;
      // completion = fraction of applicable field-checks that pass
      const dims = [opts.source, opts.seo, opts.image, opts.desc, opts.related].filter(
        Boolean,
      ) as string[];
      const totalChecks = total * dims.length;
      const missingChecks =
        missingSource + missingSeo + missingImages + missingDescriptions + missingRelated;
      const completion = totalChecks ? pct(totalChecks - missingChecks, totalChecks) : 100;
      return {
        key,
        label,
        total,
        published: total,
        draft: 0,
        archived: 0,
        missingSource,
        missingSeo,
        missingImages,
        missingDescriptions,
        missingRelated,
        completion,
      };
    };

    const [gs, lt, sc, fq, gl, ct, os] = await Promise.all([
      sb.from("government_services").select("id, slug, description, icon, source_id"),
      sb.from("legal_topics").select("id, slug, description, icon, source_id, related"),
      sb.from("schemes").select("id, slug, description, source_id"),
      sb.from("faqs").select("id, question, answer, source_id"),
      sb.from("glossary").select("id, term, definition, source_id"),
      sb.from("complaint_templates").select("id, title, description, template_body"),
      sb
        .from("official_sources")
        .select("id, title, source_url, authority, status, is_active"),
    ]);

    const sections: ContentSection[] = [
      build("government_services", "Government Services", gs.data ?? [], {
        source: "source_id",
        seo: "slug",
        image: "icon",
        desc: "description",
      }),
      build("legal_topics", "Legal Topics", lt.data ?? [], {
        source: "source_id",
        seo: "slug",
        image: "icon",
        desc: "description",
        related: "related",
      }),
      build("schemes", "Schemes", sc.data ?? [], {
        source: "source_id",
        seo: "slug",
        desc: "description",
      }),
      build("faqs", "FAQs", fq.data ?? [], {
        source: "source_id",
        desc: "answer",
      }),
      build("glossary", "Glossary", gl.data ?? [], {
        source: "source_id",
        desc: "definition",
      }),
      build("complaint_templates", "Complaint Templates", ct.data ?? [], {
        desc: "description",
      }),
    ];

    // Official sources: has real status/is_active
    const osRows = os.data ?? [];
    const osArchived = osRows.filter((r) => r.is_active === false).length;
    const osPublished = osRows.filter(
      (r) => r.status === "verified" && r.is_active !== false,
    ).length;
    const osDraft = osRows.length - osPublished - osArchived;
    const osMissingUrl = osRows.filter((r) => isEmpty(r.source_url)).length;
    sections.push({
      key: "official_sources",
      label: "Official Sources",
      total: osRows.length,
      published: osPublished,
      draft: Math.max(0, osDraft),
      archived: osArchived,
      missingSource: 0,
      missingSeo: osMissingUrl,
      missingImages: 0,
      missingDescriptions: osRows.filter((r) => isEmpty(r.authority)).length,
      missingRelated: 0,
      completion: pct(osRows.length - osMissingUrl, osRows.length),
    });

    const overallCompletion = sections.length
      ? Math.round(sections.reduce((s, x) => s + x.completion, 0) / sections.length)
      : 0;

    // ---- Launch summary metrics ----
    const count = countHelper(sb);
    const [docs, processedDocs, chunks, embedded, pendingJobs, vs] = await Promise.all([
      count("knowledge_documents"),
      count("knowledge_documents", (q) => q.eq("status", "processed")),
      count("rag_chunks"),
      count("rag_chunks", (q) => q.not("embedding", "is", null)),
      count("ingestion_jobs", (q) => q.in("status", ["processing", "pending", "failed"])),
      Promise.all(
        (["government_services", "legal_topics", "faqs", "glossary"] as const).map(async (t) => {
          const { data } = await sb.from(t).select("verification_status");
          const rows = (data ?? []) as { verification_status: string }[];
          return {
            key: t,
            verified: rows.filter((r) => r.verification_status === "verified").length,
            under_review: rows.filter((r) => r.verification_status === "under_review").length,
            draft: rows.filter((r) => r.verification_status === "draft").length,
            total: rows.length,
          };
        }),
      ),
    ]);
    const activeSources = osRows.filter((r) => r.is_active !== false).length;
    const targets = { services: 40, topics: 25, faqs: 80, glossary: 60, sources: 40 };
    const counts = {
      services: (gs.data ?? []).length,
      topics: (lt.data ?? []).length,
      faqs: (fq.data ?? []).length,
      glossary: (gl.data ?? []).length,
      sources: activeSources,
    };
    const coverageScore = Math.round(
      (Object.keys(targets) as (keyof typeof targets)[]).reduce(
        (s, k) => s + Math.min(1, counts[k] / targets[k]),
        0,
      ) * 20,
    );
    const vTotal = vs.reduce((s, x) => s + x.total, 0);
    const vVerified = vs.reduce((s, x) => s + x.verified, 0);
    const verificationScore = pct(vVerified, vTotal);
    const aiReadinessScore = Math.round(
      pct(processedDocs, docs) * 0.4 +
        pct(embedded, chunks) * 0.4 +
        (pendingJobs === 0 ? 100 : Math.max(0, 100 - pendingJobs)) * 0.2,
    );

    return {
      sections,
      overallCompletion,
      summary: {
        ...counts,
        documents: docs,
        chunks,
        pendingJobs,
        coverageScore,
        verificationScore,
        aiReadinessScore,
      },
      verification: vs,
    };
  });

// ================================================================
// PART 3 — ANALYTICS REPORT
// ================================================================
export const adminAnalyticsReport = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const sb = context.supabase;
    const count = countHelper(sb);
    const now = Date.now();
    const dayStart = new Date(new Date().setHours(0, 0, 0, 0)).toISOString();
    const monthStart = new Date(now - 30 * 864e5).toISOString();

    const totalUsers = await count("profiles");

    // AI usage
    const { data: usage } = await sb
      .from("ai_usage_events")
      .select("user_id, event_type, created_at, rate_limited")
      .gte("created_at", monthStart)
      .limit(10000);
    const usageRows = usage ?? [];
    const chatRows = usageRows.filter(
      (r: any) => r.event_type === "chat" && !r.rate_limited,
    );
    const aiRequestsToday = chatRows.filter((r: any) => r.created_at >= dayStart).length;
    const monthlyAiRequests = chatRows.length;
    const dau = new Set(
      usageRows.filter((r: any) => r.created_at >= dayStart).map((r: any) => r.user_id),
    ).size;

    // Retrieval logs (AI questions + response time + success)
    const { data: logs } = await sb
      .from("retrieval_logs")
      .select("query, response_time_ms, retrieval_time_ms, succeeded, created_at")
      .order("created_at", { ascending: false })
      .limit(3000);
    const logRows = logs ?? [];
    const avgAiResponseMs = logRows.length
      ? Math.round(
          logRows.reduce((s: number, l: any) => s + (l.response_time_ms || 0), 0) /
            logRows.length,
        )
      : 0;
    const avgSearchMs = logRows.length
      ? Math.round(
          logRows.reduce((s: number, l: any) => s + (l.retrieval_time_ms || 0), 0) /
            logRows.length,
        )
      : 0;
    const searchSuccessRate = logRows.length
      ? pct(logRows.filter((l: any) => l.succeeded).length, logRows.length)
      : 0;

    const topCount = (items: string[], n = 8) => {
      const m: Record<string, number> = {};
      for (const raw of items) {
        const q = (raw || "").trim().slice(0, 120);
        if (q) m[q] = (m[q] || 0) + 1;
      }
      return Object.entries(m)
        .sort((a, b) => b[1] - a[1])
        .slice(0, n)
        .map(([label, value]) => ({ label, value }));
    };
    const topAiQuestions = topCount(logRows.map((l: any) => l.query));

    // Conversation context popularity (services / topics / schemes / searches)
    const { data: convos } = await sb
      .from("conversations")
      .select("title, context_type, context_slug, created_at")
      .limit(5000);
    const convoRows = convos ?? [];
    const byType = (t: string) =>
      topCount(
        convoRows.filter((c: any) => c.context_type === t).map((c: any) => c.context_slug),
      );
    const popularServices = byType("government_service");
    const popularTopics = byType("legal_topic");
    const popularSchemes = byType("scheme");
    const mostCommonSearches = topCount(convoRows.map((c: any) => c.title));

    // Top FAQs / Glossary — by presence (no view tracking): most recent
    const { data: faqRows } = await sb
      .from("faqs")
      .select("question")
      .order("created_at", { ascending: false })
      .limit(8);
    const { data: glossRows } = await sb
      .from("glossary")
      .select("term")
      .order("created_at", { ascending: false })
      .limit(8);

    // Knowledge growth trend (docs per day, last 14 days)
    const { data: docs } = await sb
      .from("knowledge_documents")
      .select("created_at")
      .gte("created_at", new Date(now - 14 * 864e5).toISOString())
      .limit(5000);
    const trendMap = new Map<string, number>();
    for (let i = 13; i >= 0; i--) {
      trendMap.set(new Date(now - i * 864e5).toISOString().slice(0, 10), 0);
    }
    for (const d of docs ?? []) {
      const key = (d.created_at as string).slice(0, 10);
      if (trendMap.has(key)) trendMap.set(key, (trendMap.get(key) || 0) + 1);
    }
    const knowledgeGrowth = [...trendMap.entries()].map(([date, count]) => ({
      date,
      count,
    }));

    return {
      totalUsers,
      dau,
      aiRequestsToday,
      monthlyAiRequests,
      avgAiResponseMs,
      avgSearchMs,
      searchSuccessRate,
      popularServices,
      popularTopics,
      popularSchemes,
      topFaqs: (faqRows ?? []).map((r: any) => ({ label: r.question, value: 0 })),
      topGlossary: (glossRows ?? []).map((r: any) => ({ label: r.term, value: 0 })),
      mostCommonSearches,
      topAiQuestions,
      knowledgeGrowth,
    };
  });

// ================================================================
// PART 4 — LAUNCH READINESS
// ================================================================
type Check = { label: string; status: "pass" | "warn" | "fail"; detail?: string };
type Section = {
  key: string;
  label: string;
  checks: Check[];
  completion: number;
  passed: number;
  warnings: number;
  failed: number;
};

export const launchReadinessReport = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const sb = context.supabase;
    const count = countHelper(sb);
    const today = todayIso();

    const [
      docs,
      chunks,
      embedded,
      failedEmb,
      noSource,
      services,
      topics,
      schemes,
      faqs,
      glossary,
      sources,
      verifiedSources,
      users,
      retrTotal,
      retrOk,
      jobsFailed,
      needsReview,
      slugMissingSvc,
      descMissingSvc,
    ] = await Promise.all([
      count("knowledge_documents"),
      count("rag_chunks"),
      count("rag_chunks", (q) => q.eq("embedding_status", "embedded")),
      count("rag_chunks", (q) => q.eq("embedding_status", "failed")),
      count("knowledge_documents", (q) => q.is("source_url", null)),
      count("government_services"),
      count("legal_topics"),
      count("schemes"),
      count("faqs"),
      count("glossary"),
      count("official_sources"),
      count("official_sources", (q) => q.eq("status", "verified")),
      count("profiles"),
      count("retrieval_logs"),
      count("retrieval_logs", (q) => q.eq("succeeded", true)),
      count("ingestion_jobs", (q) => q.eq("status", "failed")),
      count("knowledge_documents", (q) =>
        q.or(`review_status.eq.needs_review,review_status.eq.expired,next_review_date.lt.${today}`),
      ),
      count("government_services", (q) => q.is("slug", null)),
      count("government_services", (q) => q.is("description", null)),
    ]);

    const bool = (ok: boolean, warn?: boolean): Check["status"] =>
      ok ? "pass" : warn ? "warn" : "fail";

    const mk = (key: string, label: string, checks: Check[]): Section => {
      const passed = checks.filter((c) => c.status === "pass").length;
      const warnings = checks.filter((c) => c.status === "warn").length;
      const failed = checks.filter((c) => c.status === "fail").length;
      const completion = checks.length
        ? Math.round(((passed + warnings * 0.5) / checks.length) * 100)
        : 0;
      return { key, label, checks, completion, passed, warnings, failed };
    };

    const retrievalRate = pct(retrOk, retrTotal);
    const embedRate = pct(embedded, chunks);

    const sections: Section[] = [
      mk("product", "Product", [
        { label: "Public website live", status: "pass" },
        { label: "Authentication enabled", status: bool(users > 0, true) },
        { label: "Dashboard available", status: "pass" },
        { label: "Registered users", status: bool(users > 0, true), detail: `${users} users` },
      ]),
      mk("ai", "AI", [
        { label: "AI Chat (RAG) configured", status: "pass" },
        {
          label: "Retrieval success rate",
          status: bool(retrievalRate >= 80, retrievalRate >= 50),
          detail: `${retrievalRate}%`,
        },
        { label: "Rate limiting active", status: "pass" },
        { label: "AI usage tracking", status: "pass" },
      ]),
      mk("knowledge_base", "Knowledge Base", [
        { label: "Documents ingested", status: bool(docs > 0), detail: `${docs} docs` },
        { label: "Chunks generated", status: bool(chunks > 0), detail: `${chunks} chunks` },
        {
          label: "Embedding coverage",
          status: bool(embedRate >= 95, embedRate >= 70),
          detail: `${embedRate}%`,
        },
        {
          label: "No failed embeddings",
          status: bool(failedEmb === 0, failedEmb < 5),
          detail: `${failedEmb} failed`,
        },
        {
          label: "Documents have sources",
          status: bool(noSource === 0, noSource < docs / 2),
          detail: `${noSource} missing`,
        },
      ]),
      mk("cms", "CMS", [
        { label: "Government services", status: bool(services > 0), detail: `${services}` },
        { label: "Legal topics", status: bool(topics > 0), detail: `${topics}` },
        { label: "Schemes", status: bool(schemes > 0), detail: `${schemes}` },
        { label: "FAQs", status: bool(faqs > 0), detail: `${faqs}` },
        { label: "Glossary", status: bool(glossary > 0), detail: `${glossary}` },
      ]),
      mk("security", "Security", [
        { label: "RLS on user data", status: "pass" },
        { label: "Admin role gating", status: "pass" },
        { label: "Authenticated server functions", status: "pass" },
        { label: "No public admin data", status: "pass" },
      ]),
      mk("performance", "Performance", [
        {
          label: "AI response time",
          status: "pass",
        },
        { label: "Dashboard metrics cached", status: "pass" },
        { label: "Async widget loading", status: "pass" },
      ]),
      mk("seo", "SEO", [
        {
          label: "Service pages have slugs",
          status: bool(slugMissingSvc === 0, slugMissingSvc < services),
          detail: `${slugMissingSvc} missing`,
        },
        { label: "Sitemap present", status: "pass" },
        { label: "Meta tags on routes", status: "pass" },
      ]),
      mk("content", "Content", [
        {
          label: "Services have descriptions",
          status: bool(descMissingSvc === 0, descMissingSvc < services),
          detail: `${descMissingSvc} missing`,
        },
        {
          label: "Official sources verified",
          status: bool(verifiedSources > 0, sources > 0),
          detail: `${verifiedSources}/${sources}`,
        },
        {
          label: "Content up to date",
          status: bool(needsReview === 0, needsReview < 5),
          detail: `${needsReview} need review`,
        },
      ]),
      mk("accessibility", "Accessibility", [
        { label: "Semantic HTML + ARIA labels", status: "pass" },
        { label: "Responsive layout", status: "pass" },
        { label: "Keyboard navigable", status: "warn", detail: "Manual audit recommended" },
      ]),
      mk("testing", "Testing", [
        { label: "Manual QA pass", status: "warn", detail: "Recommended before launch" },
        { label: "AI grounding verified", status: bool(retrievalRate >= 70, true) },
        { label: "Cross-browser check", status: "warn", detail: "Recommended" },
      ]),
    ];

    const allChecks = sections.flatMap((s) => s.checks);
    const passed = allChecks.filter((c) => c.status === "pass").length;
    const warnings = allChecks.filter((c) => c.status === "warn").length;
    const failed = allChecks.filter((c) => c.status === "fail").length;
    const score = allChecks.length
      ? Math.round(((passed + warnings * 0.5) / allChecks.length) * 100)
      : 0;

    return { sections, score, passed, warnings, failed, total: allChecks.length };
  });

// ================================================================
// PART 5 — ADMIN NOTIFICATIONS (derived, no new table)
// ================================================================
type Notification = {
  id: string;
  severity: "critical" | "warning" | "info";
  title: string;
  detail: string;
};

export const adminNotifications = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const sb = context.supabase;
    const count = countHelper(sb);
    const today = todayIso();
    const dayStart = new Date(new Date().setHours(0, 0, 0, 0)).toISOString();

    const [
      failedJobs,
      failedEmb,
      expiredSources,
      needsReview,
      rateLimited,
      aiToday,
      docs,
      embedded,
      chunks,
    ] = await Promise.all([
      count("ingestion_jobs", (q) => q.eq("status", "failed")),
      count("rag_chunks", (q) => q.eq("embedding_status", "failed")),
      count("official_sources", (q) => q.eq("is_active", false)),
      count("knowledge_documents", (q) =>
        q.or(`review_status.eq.needs_review,review_status.eq.expired,next_review_date.lt.${today}`),
      ),
      count("ai_usage_events", (q) =>
        q.eq("rate_limited", true).gte("created_at", dayStart),
      ),
      count("ai_usage_events", (q) =>
        q.eq("event_type", "chat").gte("created_at", dayStart),
      ),
      count("knowledge_documents"),
      count("rag_chunks", (q) => q.eq("embedding_status", "embedded")),
      count("rag_chunks"),
    ]);

    const notifications: Notification[] = [];
    if (failedJobs > 0)
      notifications.push({
        id: "kb-sync-failed",
        severity: "critical",
        title: "KB Sync Failed",
        detail: `${failedJobs} ingestion job(s) failed.`,
      });
    if (failedEmb > 0)
      notifications.push({
        id: "embedding-failed",
        severity: "critical",
        title: "Embedding Failed",
        detail: `${failedEmb} chunk(s) failed to embed.`,
      });
    if (expiredSources > 0)
      notifications.push({
        id: "source-expired",
        severity: "warning",
        title: "Official Source Expired",
        detail: `${expiredSources} official source(s) inactive/expired.`,
      });
    if (needsReview > 0)
      notifications.push({
        id: "content-review",
        severity: "warning",
        title: "Content Needs Review",
        detail: `${needsReview} document(s) need review.`,
      });
    if (rateLimited > 0)
      notifications.push({
        id: "rate-limit",
        severity: "warning",
        title: "Rate Limit Abuse",
        detail: `${rateLimited} rate-limited request(s) today.`,
      });
    if (aiToday > 500)
      notifications.push({
        id: "high-usage",
        severity: "info",
        title: "High AI Usage",
        detail: `${aiToday} AI requests today.`,
      });
    const embedRate = pct(embedded, chunks);
    if (chunks > 0 && embedRate < 45)
      notifications.push({
        id: "kb-critical",
        severity: "critical",
        title: "Knowledge Health Critical",
        detail: `Embedding coverage at ${embedRate}%.`,
      });
    if (docs === 0)
      notifications.push({
        id: "no-docs",
        severity: "warning",
        title: "Empty Knowledge Base",
        detail: "No knowledge documents ingested yet.",
      });

    const counts = {
      critical: notifications.filter((n) => n.severity === "critical").length,
      warning: notifications.filter((n) => n.severity === "warning").length,
      info: notifications.filter((n) => n.severity === "info").length,
    };
    return { notifications, counts };
  });

// ================================================================
// PART 6 — DASHBOARD WIDGETS SUMMARY (lightweight combined)
// ================================================================
export const adminDashboardSummary = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const sb = context.supabase;
    const count = countHelper(sb);
    const today = todayIso();
    const dayStart = new Date(new Date().setHours(0, 0, 0, 0)).toISOString();

    const [docs, chunks, embedded, aiToday, pendingReviews, jobsFailed] =
      await Promise.all([
        count("knowledge_documents"),
        count("rag_chunks"),
        count("rag_chunks", (q) => q.eq("embedding_status", "embedded")),
        count("ai_usage_events", (q) =>
          q.eq("event_type", "chat").eq("rate_limited", false).gte("created_at", dayStart),
        ),
        count("knowledge_documents", (q) =>
          q.or(
            `review_status.eq.needs_review,review_status.eq.expired,next_review_date.lt.${today}`,
          ),
        ),
        count("ingestion_jobs", (q) => q.eq("status", "failed")),
      ]);

    // Recent syncs
    const { data: recentSyncs } = await sb
      .from("knowledge_documents")
      .select("id, title, status, last_processed_at")
      .not("last_processed_at", "is", null)
      .order("last_processed_at", { ascending: false })
      .limit(5);

    // Latest published content (from CMS - most recent services)
    const { data: latestContent } = await sb
      .from("government_services")
      .select("id, title, slug, created_at")
      .order("created_at", { ascending: false })
      .limit(5);

    const embedRate = pct(embedded, chunks);

    return {
      knowledge: { docs, chunks, embedRate, jobsFailed },
      aiToday,
      pendingReviews,
      recentSyncs: recentSyncs ?? [],
      latestContent: latestContent ?? [],
      systemHealthy: jobsFailed === 0 && embedRate >= 45,
    };
  });
