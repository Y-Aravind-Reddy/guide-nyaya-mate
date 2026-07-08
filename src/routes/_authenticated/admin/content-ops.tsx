import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Gauge,
  ClipboardCheck,
  Brain,
  Link2,
  RefreshCw,
  AlertTriangle,
  ExternalLink,
  ShieldOff,
  FileWarning,
} from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { Button } from "@/components/ui/button";
import {
  contentQualityScan,
  aiCoverageReport,
  linkStatusReport,
  verifyOfficialLinks,
} from "@/lib/contentops.functions";
import {
  GlassCard,
  MetricCard,
  ProgressBar,
  ScoreRing,
  healthOf,
} from "@/components/admin/health-ui";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/content-ops")({
  head: () => ({
    meta: [
      { title: "Content Operations — NyayaMate AI" },
      {
        name: "description",
        content:
          "Enterprise ContentOps: content quality scoring, AI coverage gaps, and official link verification for NyayaMate AI.",
      },
    ],
  }),
  component: ContentOpsPage,
});

type Tab = "quality" | "coverage" | "links";

function ContentOpsPage() {
  const { isAdmin, isLoading: adminLoading } = useIsAdmin();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("quality");

  if (!adminLoading && !isAdmin) {
    return (
      <DashboardLayout title="Content Operations">
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

  const tabs: { key: Tab; label: string; icon: typeof Gauge }[] = [
    { key: "quality", label: "Quality Scanner", icon: ClipboardCheck },
    { key: "coverage", label: "AI Coverage", icon: Brain },
    { key: "links", label: "Link Verification", icon: Link2 },
  ];

  return (
    <DashboardLayout title="Content Operations">
      <div>
        <h2 className="text-2xl font-extrabold text-foreground sm:text-3xl">Content Operations</h2>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Monitor content quality, find knowledge gaps that weaken AI answers, and verify official
          source links — all from your existing Knowledge Base.
        </p>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition-colors",
              tab === t.key
                ? "border-primary bg-primary text-primary-foreground shadow-soft"
                : "border-border bg-card text-muted-foreground hover:text-foreground",
            )}
          >
            <t.icon className="h-4 w-4" /> {t.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === "quality" && isAdmin ? <QualityTab /> : null}
        {tab === "coverage" && isAdmin ? <CoverageTab /> : null}
        {tab === "links" && isAdmin ? <LinksTab /> : null}
      </div>
    </DashboardLayout>
  );
}

// ---------------------------------------------------------------- Quality
function QualityTab() {
  const fetchFn = useServerFn(contentQualityScan);
  const { data, isLoading } = useQuery({
    queryKey: ["contentops_quality"],
    queryFn: () => fetchFn(),
    staleTime: 60_000,
  });

  if (isLoading) return <p className="text-sm text-muted-foreground">Scanning published content…</p>;
  if (!data) return null;

  const issues = Object.entries(data.summary.issueCounts).sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-6">
      <GlassCard>
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <ScoreRing score={data.summary.avgQuality} label="Average Quality Score" />
          <div className="grid grid-cols-3 gap-3">
            <MetricCard label="Records" value={data.summary.totalRecords} icon={ClipboardCheck} />
            <MetricCard
              label="Completeness"
              value={`${data.summary.avgCompleteness}%`}
              health={healthOf(data.summary.avgCompleteness, 75, 45)}
            />
            <MetricCard
              label="Trust"
              value={`${data.summary.avgTrust}%`}
              health={healthOf(data.summary.avgTrust, 75, 45)}
            />
          </div>
        </div>
      </GlassCard>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {data.types.map((t) => (
          <GlassCard key={t.key}>
            <p className="text-sm font-semibold text-foreground">{t.label}</p>
            <p className="mt-2 text-2xl font-extrabold text-foreground">{t.avgQuality}</p>
            <p className="text-xs text-muted-foreground">{t.count} records</p>
            <div className="mt-2">
              <ProgressBar value={t.avgQuality} />
            </div>
          </GlassCard>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <GlassCard>
          <h3 className="text-sm font-bold text-foreground">Issues Found</h3>
          <ul className="mt-3 space-y-2">
            {issues.length === 0 ? (
              <li className="text-xs text-muted-foreground">No issues detected.</li>
            ) : (
              issues.map(([label, count]) => (
                <li key={label} className="flex items-center justify-between gap-3 text-sm">
                  <span className="flex items-center gap-2 text-foreground">
                    <AlertTriangle className="h-4 w-4 text-accent" /> {label}
                  </span>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-foreground">
                    {count}
                  </span>
                </li>
              ))
            )}
          </ul>
        </GlassCard>

        <GlassCard>
          <h3 className="text-sm font-bold text-foreground">Lowest-Quality Records</h3>
          <ul className="mt-3 max-h-[420px] space-y-2 overflow-y-auto pr-1">
            {data.worst.map((r) => (
              <li key={`${r.type}-${r.id}`} className="rounded-xl border border-border bg-background p-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="truncate text-sm font-semibold text-foreground">{r.title}</span>
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2 py-0.5 text-xs font-bold",
                      r.quality >= 75
                        ? "bg-secondary/10 text-secondary"
                        : r.quality >= 45
                          ? "bg-accent/10 text-accent"
                          : "bg-destructive/10 text-destructive",
                    )}
                  >
                    {r.quality}
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">{r.typeLabel}</p>
                {r.issues.length ? (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {r.issues.map((i) => (
                      <span
                        key={i}
                        className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground"
                      >
                        {i}
                      </span>
                    ))}
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        </GlassCard>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- Coverage
function CoverageTab() {
  const fetchFn = useServerFn(aiCoverageReport);
  const { data, isLoading } = useQuery({
    queryKey: ["contentops_coverage"],
    queryFn: () => fetchFn(),
    staleTime: 60_000,
  });

  if (isLoading) return <p className="text-sm text-muted-foreground">Analyzing AI coverage…</p>;
  if (!data) return null;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="KB Coverage"
          value={`${data.coverageRate}%`}
          icon={Brain}
          health={healthOf(data.coverageRate, 90, 60)}
          hint={`${data.syncedCount}/${data.totalCmsRecords} records synced`}
        />
        <MetricCard
          label="Answer Rate"
          value={`${data.answerRate}%`}
          health={healthOf(data.answerRate, 85, 60)}
          hint={`${data.totalQueries} AI queries`}
        />
        <MetricCard
          label="Citation Coverage"
          value={`${data.citationCoverage}%`}
          health={healthOf(data.citationCoverage, 80, 50)}
          hint={`${data.lowCitationCount} without citations`}
        />
        <MetricCard
          label="Missing Embeddings"
          value={data.missingEmbeddingsCount}
          icon={FileWarning}
          health={data.missingEmbeddingsCount === 0 ? "healthy" : "warning"}
        />
      </div>

      <GlassCard>
        <h3 className="text-sm font-bold text-foreground">Top Missing Knowledge Areas</h3>
        <p className="text-xs text-muted-foreground">
          Derived from unanswered and low-confidence AI questions.
        </p>
        <ul className="mt-3 space-y-2">
          {data.topMissingAreas.length === 0 ? (
            <li className="text-xs text-muted-foreground">No knowledge gaps detected yet.</li>
          ) : (
            data.topMissingAreas.map((a) => (
              <li key={a.label} className="flex items-center justify-between gap-3 text-sm">
                <span className="truncate text-foreground">{a.label}</span>
                <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-semibold text-destructive">
                  {a.value}
                </span>
              </li>
            ))
          )}
        </ul>
      </GlassCard>

      <div className="grid gap-6 lg:grid-cols-2">
        <GlassCard>
          <h3 className="text-sm font-bold text-foreground">Questions AI Couldn't Answer</h3>
          <ul className="mt-3 max-h-72 space-y-2 overflow-y-auto pr-1">
            {data.unanswered.length === 0 ? (
              <li className="text-xs text-muted-foreground">None recorded.</li>
            ) : (
              data.unanswered.map((u) => (
                <li key={u.label} className="flex items-center justify-between gap-3 text-sm">
                  <span className="truncate text-foreground">{u.label}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">×{u.value}</span>
                </li>
              ))
            )}
          </ul>
        </GlassCard>

        <GlassCard>
          <h3 className="text-sm font-bold text-foreground">Low-Confidence Topics</h3>
          <ul className="mt-3 max-h-72 space-y-2 overflow-y-auto pr-1">
            {data.lowConfidence.length === 0 ? (
              <li className="text-xs text-muted-foreground">None recorded.</li>
            ) : (
              data.lowConfidence.map((u) => (
                <li key={u.label} className="flex items-center justify-between gap-3 text-sm">
                  <span className="truncate text-foreground">{u.label}</span>
                  <span className="shrink-0 text-xs text-accent">{u.conf ?? 0}%</span>
                </li>
              ))
            )}
          </ul>
        </GlassCard>
      </div>

      {data.missingKb.length ? (
        <GlassCard>
          <h3 className="flex items-center gap-2 text-sm font-bold text-foreground">
            <ShieldOff className="h-4 w-4" /> Content Without Knowledge Base Entries
          </h3>
          <div className="mt-3 space-y-3">
            {data.missingKb.map((g) => (
              <div key={g.type}>
                <p className="text-xs font-semibold text-muted-foreground">
                  {g.label} ({g.items.length})
                </p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {g.items.map((it) => (
                    <span
                      key={it.id}
                      className="rounded-md bg-muted px-1.5 py-0.5 text-[11px] text-foreground"
                    >
                      {it.title}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------- Links
const LINK_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  healthy: { bg: "bg-secondary/10", text: "text-secondary", label: "Healthy" },
  broken: { bg: "bg-destructive/10", text: "text-destructive", label: "Broken" },
  redirected: { bg: "bg-accent/10", text: "text-accent", label: "Redirected" },
  needs_review: { bg: "bg-accent/10", text: "text-accent", label: "Needs Review" },
  none: { bg: "bg-muted", text: "text-muted-foreground", label: "—" },
};

function LinkChip({ state, code }: { state: string | null; code?: number | null }) {
  const s = LINK_STYLES[state ?? "none"] ?? LINK_STYLES.needs_review;
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold", s.bg, s.text)}>
      {s.label}
      {code ? <span className="opacity-70">{code}</span> : null}
    </span>
  );
}

function LinksTab() {
  const qc = useQueryClient();
  const fetchFn = useServerFn(linkStatusReport);
  const verifyFn = useServerFn(verifyOfficialLinks);
  const { data, isLoading } = useQuery({
    queryKey: ["contentops_links"],
    queryFn: () => fetchFn(),
    staleTime: 30_000,
  });

  const verify = useMutation({
    mutationFn: () => verifyFn({ data: {} }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["contentops_links"] }),
  });

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading link statuses…</p>;
  if (!data) return null;

  const c = data.counts;

  return (
    <div className="space-y-6">
      <GlassCard>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-foreground">Official Source Links</h3>
            <p className="text-xs text-muted-foreground">
              {data.lastChecked
                ? `Last checked ${new Date(data.lastChecked).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}`
                : "Not checked yet"}
            </p>
          </div>
          <Button onClick={() => verify.mutate()} disabled={verify.isPending}>
            <RefreshCw className={cn("mr-2 h-4 w-4", verify.isPending && "animate-spin")} />
            {verify.isPending ? "Verifying…" : "Verify All Links"}
          </Button>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
          {[
            { k: "healthy", label: "Healthy", cls: "text-secondary" },
            { k: "redirected", label: "Redirected", cls: "text-accent" },
            { k: "needs_review", label: "Needs Review", cls: "text-accent" },
            { k: "broken", label: "Broken", cls: "text-destructive" },
            { k: "unchecked", label: "Unchecked", cls: "text-muted-foreground" },
          ].map((s) => (
            <div key={s.k} className="rounded-xl border border-border bg-background p-3 text-center">
              <p className={cn("text-2xl font-extrabold", s.cls)}>{(c as any)[s.k] ?? 0}</p>
              <p className="text-[11px] text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      </GlassCard>

      <GlassCard>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-[11px] uppercase tracking-wide text-muted-foreground">
                <th className="py-2 pr-3">Source</th>
                <th className="px-2 py-2">Overall</th>
                <th className="px-2 py-2">Website</th>
                <th className="px-2 py-2">Apply</th>
                <th className="px-2 py-2">Forms</th>
                <th className="px-2 py-2">Checked</th>
              </tr>
            </thead>
            <tbody>
              {data.sources.map((r) => (
                <tr key={r.id} className="border-b border-border/60 last:border-0">
                  <td className="max-w-[220px] py-2.5 pr-3">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate font-medium text-foreground">{r.title}</span>
                      {r.source_url ? (
                        <a href={r.source_url} target="_blank" rel="noreferrer" className="text-primary">
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : null}
                    </div>
                    <span className="truncate text-[11px] text-muted-foreground">{r.authority}</span>
                  </td>
                  <td className="px-2 py-2.5">
                    {r.link_status ? (
                      <LinkChip state={r.link_status} />
                    ) : (
                      <span className="text-[11px] text-muted-foreground">unchecked</span>
                    )}
                  </td>
                  <td className="px-2 py-2.5">
                    <LinkChip state={r.website_link_status} code={r.website_http_code} />
                  </td>
                  <td className="px-2 py-2.5">
                    <LinkChip state={r.apply_link_status} code={r.apply_http_code} />
                  </td>
                  <td className="px-2 py-2.5">
                    <LinkChip state={r.forms_link_status} code={r.forms_http_code} />
                  </td>
                  <td className="px-2 py-2.5 text-[11px] text-muted-foreground">
                    {r.links_checked_at
                      ? new Date(r.links_checked_at).toLocaleDateString("en-IN")
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}

