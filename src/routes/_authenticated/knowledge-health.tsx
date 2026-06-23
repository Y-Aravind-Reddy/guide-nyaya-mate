import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Gauge, FileText, Layers, ShieldCheck, ThumbsUp } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { Button } from "@/components/ui/button";
import { knowledgeHealth } from "@/lib/kb.functions";

export const Route = createFileRoute("/_authenticated/knowledge-health")({
  head: () => ({
    meta: [
      { title: "Knowledge Health — NyayaMate AI" },
      {
        name: "description",
        content: "Overall health of the knowledge base powering NyayaMate AI retrieval.",
      },
    ],
  }),
  component: KnowledgeHealthPage,
});

function band(pct: number) {
  if (pct >= 75) return { label: "Healthy", color: "text-secondary", bg: "bg-secondary/10", bar: "bg-secondary" };
  if (pct >= 45) return { label: "Needs Attention", color: "text-accent", bg: "bg-accent/10", bar: "bg-accent" };
  return { label: "Critical", color: "text-destructive", bg: "bg-destructive/10", bar: "bg-destructive" };
}

function KnowledgeHealthPage() {
  const { isAdmin, isLoading: adminLoading } = useIsAdmin();
  const navigate = useNavigate();
  const fetchFn = useServerFn(knowledgeHealth);

  const { data } = useQuery({
    queryKey: ["knowledge_health"],
    queryFn: () => fetchFn(),
    enabled: isAdmin,
  });

  if (!adminLoading && !isAdmin) {
    return (
      <DashboardLayout title="Knowledge Health">
        <div className="grid place-items-center rounded-[20px] border border-border bg-card p-16 text-center shadow-card">
          <Gauge className="h-10 w-10 text-muted-foreground" />
          <h2 className="mt-4 text-lg font-bold text-foreground">Admin access required</h2>
          <Button className="mt-5" onClick={() => navigate({ to: "/dashboard" })}>
            Back to Dashboard
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const score = data?.score ?? 0;
  const scoreBand = band(score);

  const metrics = [
    { label: "Verification Coverage", value: data?.verificationCoverage ?? 0 },
    { label: "Trust Coverage", value: data?.trustCoverage ?? 0 },
    { label: "Embedding Coverage", value: data?.embedCoverage ?? 0 },
    { label: "Feedback Score", value: data?.feedbackScore ?? 0 },
  ];

  const counts = [
    { label: "Documents", value: data?.totalDocs ?? 0, icon: FileText },
    { label: "Chunks", value: data?.totalChunks ?? 0, icon: Layers },
    { label: "Official Sources", value: data?.officialSources ?? 0, icon: ShieldCheck },
    { label: "Feedback Entries", value: data?.feedbackCount ?? 0, icon: ThumbsUp },
  ];

  return (
    <DashboardLayout title="Knowledge Health">
      <div>
        <h2 className="text-2xl font-extrabold text-foreground sm:text-3xl">Knowledge Health</h2>
        <p className="mt-1 max-w-xl text-sm text-muted-foreground">
          A single score for how trustworthy and AI-ready your knowledge base is.
        </p>
      </div>

      {/* Score */}
      <div className="mt-6 rounded-[20px] border border-border bg-card p-6 shadow-card">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <div className="flex items-center gap-5">
            <div className={`grid h-24 w-24 place-items-center rounded-full ${scoreBand.bg}`}>
              <span className={`text-3xl font-extrabold ${scoreBand.color}`}>{score}</span>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Knowledge Base Score</p>
              <p className={`text-xl font-bold ${scoreBand.color}`}>{scoreBand.label}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {counts.map((c) => (
              <div key={c.label} className="rounded-xl border border-border bg-background px-4 py-3 text-center">
                <c.icon className="mx-auto h-4 w-4 text-muted-foreground" />
                <p className="mt-1 text-lg font-extrabold text-foreground">{c.value}</p>
                <p className="text-[11px] text-muted-foreground">{c.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Coverage bars */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {metrics.map((m) => {
          const b = band(m.value);
          return (
            <div key={m.label} className="rounded-[20px] border border-border bg-card p-5 shadow-card">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-foreground">{m.label}</p>
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${b.bg} ${b.color}`}>
                  {m.value}%
                </span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                <div className={`h-full rounded-full ${b.bar}`} style={{ width: `${m.value}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </DashboardLayout>
  );
}
