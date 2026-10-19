import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Gauge, Rocket } from "lucide-react";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { Button } from "@/components/ui/button";
import { launchReadinessReport } from "@/lib/admin-health.functions";
import { GlassCard, ProgressBar, ScoreRing, CheckIcon, StatusDot, healthOf } from "@/components/admin/health-ui";

export const Route = createFileRoute("/_authenticated/admin/launch-readiness")({
  head: () => ({
    meta: [
      { title: "Launch Readiness — NyayaMate AI" },
      { name: "description", content: "Live launch-readiness checklists and score for NyayaMate AI." },
    ],
  }),
  component: LaunchReadinessPage,
});

function LaunchReadinessPage() {
  const { isAdmin, isLoading: adminLoading } = useIsAdmin();
  const navigate = useNavigate();
  const fetchFn = useServerFn(launchReadinessReport);
  const { data } = useQuery({
    queryKey: ["admin_launch_readiness"],
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

  return (
    <DashboardLayout title="Launch Readiness">
      <div>
        <h2 className="text-2xl font-extrabold text-foreground sm:text-3xl">Launch Readiness</h2>
        <p className="mt-1 max-w-xl text-sm text-muted-foreground">
          Live pre-launch checklist across product, AI, content, security, and more.
        </p>
      </div>

      <GlassCard className="mt-6">
        <div className="flex flex-col items-center gap-5 sm:flex-row sm:justify-between">
          <ScoreRing score={data?.score ?? 0} label="Overall Launch Readiness" />
          <div className="flex gap-3">
            <div className="rounded-xl bg-secondary/10 px-4 py-3 text-center">
              <p className="text-xl font-extrabold text-secondary">{data?.passed ?? 0}</p>
              <p className="text-[11px] text-muted-foreground">Passed</p>
            </div>
            <div className="rounded-xl bg-accent/10 px-4 py-3 text-center">
              <p className="text-xl font-extrabold text-accent">{data?.warnings ?? 0}</p>
              <p className="text-[11px] text-muted-foreground">Warnings</p>
            </div>
            <div className="rounded-xl bg-destructive/10 px-4 py-3 text-center">
              <p className="text-xl font-extrabold text-destructive">{data?.failed ?? 0}</p>
              <p className="text-[11px] text-muted-foreground">Failed</p>
            </div>
          </div>
        </div>
      </GlassCard>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {(data?.sections ?? []).map((s) => (
          <GlassCard key={s.key}>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Rocket className="h-4 w-4 text-primary" />
                <h3 className="text-base font-bold text-foreground">{s.label}</h3>
                <StatusDot health={healthOf(s.completion, 80, 50)} />
              </div>
              <span className="text-sm font-semibold text-foreground">{s.completion}%</span>
            </div>
            <div className="mt-3">
              <ProgressBar value={s.completion} />
            </div>
            <ul className="mt-4 space-y-2">
              {s.checks.map((c, i) => (
                <li key={i} className="flex items-center justify-between gap-3 text-sm">
                  <span className="flex min-w-0 items-center gap-2">
                    <CheckIcon status={c.status} />
                    <span className="truncate text-foreground">{c.label}</span>
                  </span>
                  {c.detail ? (
                    <span className="shrink-0 text-xs text-muted-foreground">{c.detail}</span>
                  ) : null}
                </li>
              ))}
            </ul>
          </GlassCard>
        ))}
      </div>
    </DashboardLayout>
  );
}
