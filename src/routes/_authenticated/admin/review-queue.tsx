import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Gauge, Flag, AlertTriangle, HelpCircle, ShieldCheck } from "lucide-react";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { Button } from "@/components/ui/button";
import { GlassCard, MetricCard } from "@/components/admin/health-ui";
import { answerQualityReport } from "@/lib/answer-quality.functions";

export const Route = createFileRoute("/_authenticated/admin/review-queue")({
  head: () => ({
    meta: [
      { title: "AI Review Queue — NyayaMate AI" },
      {
        name: "description",
        content:
          "Admin review queue for reported AI answers, low-confidence responses, and knowledge gaps.",
      },
    ],
  }),
  component: ReviewQueuePage,
});

function fmt(d: string) {
  return new Date(d).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function ReviewQueuePage() {
  const { isAdmin, isLoading: adminLoading } = useIsAdmin();
  const navigate = useNavigate();
  const fetchFn = useServerFn(answerQualityReport);
  const { data, isLoading } = useQuery({
    queryKey: ["admin_answer_quality"],
    queryFn: () => fetchFn(),
    enabled: isAdmin,
    staleTime: 60_000,
  });

  if (!adminLoading && !isAdmin) {
    return (
        <div className="grid place-items-center rounded-[20px] border border-border bg-card p-16 text-center shadow-card">
          <Gauge className="h-10 w-10 text-muted-foreground" />
          <h2 className="mt-4 text-lg font-bold text-foreground">Admin access required</h2>
          <Button className="mt-5" onClick={() => navigate({ to: "/dashboard" })}>
            Back to Dashboard
          </Button>
        </div>
    );
  }

  const s = data?.summary;

  return (
      <div>
        <h2 className="text-2xl font-extrabold text-foreground sm:text-3xl">AI Review Queue</h2>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Reported answers, low-confidence responses, and repeated questions the knowledge base
          could not answer.
        </p>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard icon={Flag} label="Reported answers" value={s?.reportedCount ?? 0} />
        <MetricCard
          icon={AlertTriangle}
          label="Low confidence"
          value={s?.lowConfidenceCount ?? 0}
        />
        <MetricCard icon={HelpCircle} label="Unanswered" value={s?.unansweredCount ?? 0} />
        <MetricCard
          icon={ShieldCheck}
          label="Avg confidence"
          value={s?.avgConfidence == null ? "—" : `${Math.round(s.avgConfidence * 100)}%`}
        />
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <GlassCard>
          <h3 className="text-sm font-bold text-foreground">Reported answers</h3>
          <div className="mt-3 space-y-3">
            {isLoading && <p className="text-xs text-muted-foreground">Loading…</p>}
            {!isLoading && (data?.reported.length ?? 0) === 0 && (
              <p className="text-xs text-muted-foreground">No reported answers. </p>
            )}
            {data?.reported.map((r) => (
              <div key={r.id} className="rounded-xl border border-border bg-card/60 p-3 text-xs">
                <p className="font-semibold text-foreground">{r.query ?? "(no question saved)"}</p>
                <p className="mt-1 line-clamp-4 text-muted-foreground">{r.response}</p>
                {r.comment ? (
                  <p className="mt-1 text-destructive">Comment: {r.comment}</p>
                ) : null}
                <p className="mt-1 text-[11px] text-muted-foreground">{fmt(r.createdAt)}</p>
              </div>
            ))}
          </div>
        </GlassCard>

        <div className="space-y-5">
          <GlassCard>
            <h3 className="text-sm font-bold text-foreground">Low-confidence responses</h3>
            <div className="mt-3 space-y-2">
              {!isLoading && (data?.lowConfidence.length ?? 0) === 0 && (
                <p className="text-xs text-muted-foreground">Nothing below the threshold.</p>
              )}
              {data?.lowConfidence.slice(0, 25).map((l) => (
                <div
                  key={l.id}
                  className="flex items-start justify-between gap-3 rounded-xl border border-border bg-card/60 p-3 text-xs"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground">{l.query}</p>
                    <p className="text-[11px] text-muted-foreground">{fmt(l.createdAt)}</p>
                  </div>
                  <span className="shrink-0 font-semibold text-accent">
                    {l.confidence == null ? "—" : `${Math.round(l.confidence * 100)}%`}
                  </span>
                </div>
              ))}
            </div>
          </GlassCard>

          <GlassCard>
            <h3 className="text-sm font-bold text-foreground">Knowledge gaps</h3>
            <p className="text-xs text-muted-foreground">
              Repeated questions the knowledge base could not answer confidently.
            </p>
            <ul className="mt-3 space-y-1.5 text-xs">
              {data?.knowledgeGaps.map((g) => (
                <li key={g.query} className="flex items-center justify-between gap-3">
                  <span className="truncate text-foreground">{g.query}</span>
                  <span className="shrink-0 text-muted-foreground">×{g.occurrences}</span>
                </li>
              ))}
              {!isLoading && (data?.knowledgeGaps.length ?? 0) === 0 && (
                <li className="text-muted-foreground">No gaps detected.</li>
              )}
            </ul>
          </GlassCard>
        </div>
      </div>
  );
}
