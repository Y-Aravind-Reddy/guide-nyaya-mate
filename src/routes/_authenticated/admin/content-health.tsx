import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Gauge, Database } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { Button } from "@/components/ui/button";
import { contentHealthReport } from "@/lib/admin-health.functions";
import { GlassCard, ProgressBar, ScoreRing, StatusDot, healthOf } from "@/components/admin/health-ui";

export const Route = createFileRoute("/_authenticated/admin/content-health")({
  head: () => ({
    meta: [
      { title: "Content Health — NyayaMate AI" },
      { name: "description", content: "Content completeness and quality across all NyayaMate AI CMS modules." },
    ],
  }),
  component: ContentHealthPage,
});

function ContentHealthPage() {
  const { isAdmin, isLoading: adminLoading } = useIsAdmin();
  const navigate = useNavigate();
  const fetchFn = useServerFn(contentHealthReport);
  const { data } = useQuery({
    queryKey: ["admin_content_health"],
    queryFn: () => fetchFn(),
    enabled: isAdmin,
    staleTime: 60_000,
  });

  if (!adminLoading && !isAdmin) {
    return (
      <DashboardLayout title="Content Health">
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

  const cols = [
    { key: "total", label: "Total" },
    { key: "published", label: "Published" },
    { key: "draft", label: "Draft" },
    { key: "archived", label: "Archived" },
    { key: "missingSource", label: "No Source" },
    { key: "missingSeo", label: "No SEO" },
    { key: "missingImages", label: "No Image" },
    { key: "missingDescriptions", label: "No Desc" },
    { key: "missingRelated", label: "No Related" },
  ] as const;

  return (
    <DashboardLayout title="Content Health">
      <div>
        <h2 className="text-2xl font-extrabold text-foreground sm:text-3xl">Content Health</h2>
        <p className="mt-1 max-w-xl text-sm text-muted-foreground">
          Completeness and quality of every CMS module and official source.
        </p>
      </div>

      <GlassCard className="mt-6">
        <div className="grid gap-6 sm:grid-cols-3">
          <ScoreRing score={data?.summary.coverageScore ?? 0} label="Coverage Score" />
          <ScoreRing score={data?.summary.verificationScore ?? 0} label="Verification Score" />
          <ScoreRing score={data?.summary.aiReadinessScore ?? 0} label="AI Readiness Score" />
        </div>
        <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
          {(
            [
              ["Services", data?.summary.services],
              ["Topics", data?.summary.topics],
              ["FAQs", data?.summary.faqs],
              ["Glossary", data?.summary.glossary],
              ["Sources", data?.summary.sources],
              ["Documents", data?.summary.documents],
              ["Chunks", data?.summary.chunks],
            ] as const
          ).map(([label, v]) => (
            <div key={label} className="rounded-xl border border-border bg-background px-3 py-3 text-center">
              <p className="text-lg font-extrabold text-foreground">{v ?? 0}</p>
              <p className="text-[11px] text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
          <Database className="h-4 w-4" /> Overall field completion {data?.overallCompletion ?? 0}% ·{" "}
          {data?.summary.pendingJobs ?? 0} sync jobs pending
        </div>
      </GlassCard>

      <GlassCard className="mt-6">
        <h3 className="text-base font-bold text-foreground">Content Verification Status</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {(data?.verification ?? []).map((v) => (
            <div key={v.key} className="rounded-xl border border-border bg-background p-4">
              <p className="text-sm font-semibold capitalize text-foreground">{v.key.replace(/_/g, " ")}</p>
              <div className="mt-2 space-y-1 text-xs">
                <p className="flex justify-between"><span className="text-secondary">Verified</span><b>{v.verified}</b></p>
                <p className="flex justify-between"><span className="text-accent">Under Review</span><b>{v.under_review}</b></p>
                <p className="flex justify-between"><span className="text-muted-foreground">Draft</span><b>{v.draft}</b></p>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>

      <div className="mt-6 space-y-4">
        {(data?.sections ?? []).map((s) => (
          <GlassCard key={s.key}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <h3 className="text-base font-bold text-foreground">{s.label}</h3>
                <StatusDot health={healthOf(s.completion, 75, 45)} />
              </div>
              <span className="text-sm font-semibold text-foreground">{s.completion}%</span>
            </div>
            <div className="mt-3">
              <ProgressBar value={s.completion} />
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-9">
              {cols.map((c) => (
                <div key={c.key} className="rounded-xl border border-border bg-background px-2 py-2 text-center">
                  <p className="text-base font-extrabold text-foreground">{(s as any)[c.key]}</p>
                  <p className="text-[10px] leading-tight text-muted-foreground">{c.label}</p>
                </div>
              ))}
            </div>
          </GlassCard>
        ))}
      </div>
    </DashboardLayout>
  );
}
