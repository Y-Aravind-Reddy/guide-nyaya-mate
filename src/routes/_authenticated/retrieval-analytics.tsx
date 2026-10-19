import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Activity, Clock, Search, XCircle, Zap, TrendingUp } from "lucide-react";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { Button } from "@/components/ui/button";
import { retrievalAnalytics } from "@/lib/kb.functions";

export const Route = createFileRoute("/_authenticated/retrieval-analytics")({
  head: () => ({
    meta: [
      { title: "Retrieval Analytics — NyayaMate AI" },
      {
        name: "description",
        content: "Monitor AI retrieval quality, top questions, failed queries and response times.",
      },
    ],
  }),
  component: RetrievalAnalyticsPage,
});

function RetrievalAnalyticsPage() {
  const { isAdmin, isLoading: adminLoading } = useIsAdmin();
  const navigate = useNavigate();
  const fetchFn = useServerFn(retrievalAnalytics);

  const { data, isLoading } = useQuery({
    queryKey: ["retrieval_analytics"],
    queryFn: () => fetchFn(),
    enabled: isAdmin,
  });

  if (!adminLoading && !isAdmin) {
    return (
        <div className="grid place-items-center rounded-[20px] border border-border bg-card p-16 text-center shadow-card">
          <Activity className="h-10 w-10 text-muted-foreground" />
          <h2 className="mt-4 text-lg font-bold text-foreground">Admin access required</h2>
          <Button className="mt-5" onClick={() => navigate({ to: "/dashboard" })}>
            Back to Dashboard
          </Button>
        </div>
    );
  }

  const cards = [
    { label: "Total Queries", value: data?.total ?? 0, icon: Search, tint: "text-primary", bg: "bg-primary/10" },
    { label: "Avg Retrieval", value: `${data?.avgRetrievalMs ?? 0} ms`, icon: Zap, tint: "text-secondary", bg: "bg-secondary/10" },
    { label: "Avg Response", value: `${data?.avgResponseMs ?? 0} ms`, icon: Clock, tint: "text-accent", bg: "bg-accent/10" },
    { label: "Failed Queries", value: data?.failedCount ?? 0, icon: XCircle, tint: "text-destructive", bg: "bg-destructive/10" },
  ];

  return (
    <DashboardLayout title="Retrieval Analytics">
      <div>
        <h2 className="text-2xl font-extrabold text-foreground sm:text-3xl">Retrieval Analytics</h2>
        <p className="mt-1 max-w-xl text-sm text-muted-foreground">
          Monitor how the AI retrieves grounded knowledge — quality, latency and failures.
        </p>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-[20px] border border-border bg-card p-4 shadow-card">
            <span className={`grid h-10 w-10 place-items-center rounded-2xl ${c.bg} ${c.tint}`}>
              <c.icon className="h-5 w-5" />
            </span>
            <p className="mt-3 text-2xl font-extrabold text-foreground">{c.value}</p>
            <p className="text-xs text-muted-foreground">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-[20px] border border-border bg-card p-5 shadow-card">
          <h3 className="flex items-center gap-2 text-sm font-bold text-foreground">
            <TrendingUp className="h-4 w-4 text-primary" /> Top Questions
          </h3>
          <ul className="mt-3 space-y-2">
            {(data?.topQuestions ?? []).map((q) => (
              <li key={q.query} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background px-3 py-2">
                <span className="truncate text-sm text-foreground">{q.query}</span>
                <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                  {q.count}
                </span>
              </li>
            ))}
            {!isLoading && (data?.topQuestions ?? []).length === 0 && (
              <p className="text-sm text-muted-foreground">No queries logged yet.</p>
            )}
          </ul>
        </div>

        <div className="rounded-[20px] border border-border bg-card p-5 shadow-card">
          <h3 className="flex items-center gap-2 text-sm font-bold text-foreground">
            <XCircle className="h-4 w-4 text-destructive" /> Failed Queries
          </h3>
          <ul className="mt-3 space-y-2">
            {(data?.failedQueries ?? []).map((q, i) => (
              <li key={i} className="rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground">
                {q.query || "—"}
              </li>
            ))}
            {!isLoading && (data?.failedQueries ?? []).length === 0 && (
              <p className="text-sm text-muted-foreground">No failed retrievals. 🎉</p>
            )}
          </ul>
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-[20px] border border-border bg-card shadow-card">
        <div className="border-b border-border px-5 py-3">
          <h3 className="text-sm font-bold text-foreground">Recent Retrievals</h3>
        </div>
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-2.5 font-semibold">Query</th>
              <th className="px-4 py-2.5 font-semibold">Retrieval</th>
              <th className="px-4 py-2.5 font-semibold">Response</th>
              <th className="px-4 py-2.5 font-semibold">Confidence</th>
              <th className="px-4 py-2.5 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {(data?.recent ?? []).map((r) => (
              <tr key={r.id}>
                <td className="max-w-xs truncate px-4 py-2.5 text-foreground">{r.query}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{r.retrieval_time_ms ?? 0} ms</td>
                <td className="px-4 py-2.5 text-muted-foreground">{r.response_time_ms ?? 0} ms</td>
                <td className="px-4 py-2.5 text-muted-foreground">
                  {r.confidence_score != null ? `${Math.round(Number(r.confidence_score) * 100)}%` : "—"}
                </td>
                <td className="px-4 py-2.5">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${r.succeeded ? "bg-secondary/10 text-secondary" : "bg-destructive/10 text-destructive"}`}>
                    {r.succeeded ? "grounded" : "no match"}
                  </span>
                </td>
              </tr>
            ))}
            {(data?.recent ?? []).length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-sm text-muted-foreground">
                  No retrieval activity yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
}
