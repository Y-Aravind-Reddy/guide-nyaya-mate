import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden: admin access required");
}

export type ReportedAnswer = {
  id: string;
  createdAt: string;
  rating: string;
  query: string | null;
  response: string | null;
  comment: string | null;
};

export type LowConfidenceQuery = {
  id: string;
  createdAt: string;
  query: string;
  confidence: number | null;
  succeeded: boolean;
  model: string | null;
};

export type AnswerQualityReport = {
  summary: {
    reportedCount: number;
    lowConfidenceCount: number;
    unansweredCount: number;
    avgConfidence: number | null;
  };
  reported: ReportedAnswer[];
  lowConfidence: LowConfidenceQuery[];
  knowledgeGaps: { query: string; occurrences: number }[];
};

/** Admin review queue: reported answers, low-confidence queries, knowledge gaps. */
export const answerQualityReport = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AnswerQualityReport> => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const [feedbackRes, logsRes] = await Promise.all([
      supabaseAdmin
        .from("ai_feedback")
        .select("id, created_at, rating, query, response, feedback_comment")
        .eq("rating", "down")
        .order("created_at", { ascending: false })
        .limit(100),
      supabaseAdmin
        .from("retrieval_logs")
        .select("id, created_at, query, confidence_score, succeeded, model_used")
        .order("created_at", { ascending: false })
        .limit(400),
    ]);

    const reported: ReportedAnswer[] = (feedbackRes.data ?? []).map((f: any) => ({
      id: f.id,
      createdAt: f.created_at,
      rating: f.rating,
      query: f.query ?? null,
      response: f.response ?? null,
      comment: f.feedback_comment ?? null,
    }));

    const logs = logsRes.data ?? [];
    const lowConfidence: LowConfidenceQuery[] = logs
      .filter((l: any) => !l.succeeded || (l.confidence_score ?? 0) < 0.4)
      .slice(0, 100)
      .map((l: any) => ({
        id: l.id,
        createdAt: l.created_at,
        query: l.query,
        confidence: l.confidence_score,
        succeeded: l.succeeded,
        model: l.model_used ?? null,
      }));

    const gapCounts = new Map<string, number>();
    for (const l of logs) {
      if (l.succeeded && (l.confidence_score ?? 0) >= 0.4) continue;
      const key = (l.query ?? "").trim().toLowerCase().slice(0, 120);
      if (!key) continue;
      gapCounts.set(key, (gapCounts.get(key) ?? 0) + 1);
    }
    const knowledgeGaps = [...gapCounts.entries()]
      .map(([query, occurrences]) => ({ query, occurrences }))
      .sort((a, b) => b.occurrences - a.occurrences)
      .slice(0, 20);

    const scored = logs
      .map((l: any) => l.confidence_score)
      .filter((c: number | null) => typeof c === "number") as number[];
    const avgConfidence = scored.length
      ? Number((scored.reduce((s, c) => s + c, 0) / scored.length).toFixed(3))
      : null;

    return {
      summary: {
        reportedCount: reported.length,
        lowConfidenceCount: lowConfidence.length,
        unansweredCount: logs.filter((l: any) => !l.succeeded).length,
        avgConfidence,
      },
      reported,
      lowConfidence,
      knowledgeGaps,
    };
  });
