import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Sparkles,
  Database,
  ClipboardList,
  RefreshCw,
  FileText,
  Activity,
  ChevronRight,
} from "lucide-react";
import { adminDashboardSummary } from "@/lib/admin-health.functions";
import { contentQualityScan } from "@/lib/contentops.functions";
import { GlassCard, ProgressBar, StatusDot, healthOf } from "@/components/admin/health-ui";

/** Admin-only widget grid for the main dashboard (Part 6). */
export function AdminWidgets() {
  const fetchFn = useServerFn(adminDashboardSummary);
  const { data } = useQuery({
    queryKey: ["admin_dashboard_summary"],
    queryFn: () => fetchFn(),
    staleTime: 60_000,
  });

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground">Admin Overview</h2>
        <Link to="/admin/launch-readiness" className="text-sm font-semibold text-primary hover:underline">
          Launch readiness
        </Link>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <GlassCard>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-sm text-muted-foreground">
              <Database className="h-4 w-4" /> Knowledge Health
            </span>
            <StatusDot health={healthOf(data?.knowledge.embedRate ?? 0, 95, 70)} />
          </div>
          <p className="mt-3 text-2xl font-extrabold text-foreground">{data?.knowledge.embedRate ?? 0}%</p>
          <p className="text-xs text-muted-foreground">{data?.knowledge.docs ?? 0} docs · {data?.knowledge.chunks ?? 0} chunks</p>
          <div className="mt-3">
            <ProgressBar value={data?.knowledge.embedRate ?? 0} />
          </div>
          <Link to="/admin/knowledge-health" className="mt-3 flex items-center gap-1 text-xs font-semibold text-primary">
            Details <ChevronRight className="h-3 w-3" />
          </Link>
        </GlassCard>

        <GlassCard>
          <span className="flex items-center gap-2 text-sm text-muted-foreground">
            <Sparkles className="h-4 w-4" /> AI Usage Today
          </span>
          <p className="mt-3 text-2xl font-extrabold text-foreground">{data?.aiToday ?? 0}</p>
          <p className="text-xs text-muted-foreground">chat requests</p>
          <Link to="/admin/ai-usage" className="mt-8 flex items-center gap-1 text-xs font-semibold text-primary">
            Details <ChevronRight className="h-3 w-3" />
          </Link>
        </GlassCard>

        <GlassCard>
          <span className="flex items-center gap-2 text-sm text-muted-foreground">
            <ClipboardList className="h-4 w-4" /> Pending Reviews
          </span>
          <p className="mt-3 text-2xl font-extrabold text-foreground">{data?.pendingReviews ?? 0}</p>
          <p className="text-xs text-muted-foreground">documents need review</p>
          <Link to="/admin/content-health" className="mt-8 flex items-center gap-1 text-xs font-semibold text-primary">
            Content health <ChevronRight className="h-3 w-3" />
          </Link>
        </GlassCard>

        <GlassCard>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-sm text-muted-foreground">
              <Activity className="h-4 w-4" /> System Health
            </span>
            <StatusDot health={data?.systemHealthy ? "healthy" : "warning"} />
          </div>
          <p className="mt-3 text-2xl font-extrabold text-foreground">
            {data?.systemHealthy ? "Operational" : "Check alerts"}
          </p>
          <p className="text-xs text-muted-foreground">{data?.knowledge.jobsFailed ?? 0} failed sync jobs</p>
          <Link to="/admin/notifications" className="mt-3 flex items-center gap-1 text-xs font-semibold text-primary">
            Notifications <ChevronRight className="h-3 w-3" />
          </Link>
        </GlassCard>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <GlassCard>
          <h3 className="flex items-center gap-2 text-sm font-bold text-foreground">
            <RefreshCw className="h-4 w-4" /> Recent Syncs
          </h3>
          <ul className="mt-3 space-y-2">
            {(data?.recentSyncs ?? []).length === 0 ? (
              <li className="text-xs text-muted-foreground">No recent syncs.</li>
            ) : (
              (data?.recentSyncs ?? []).map((r: any) => (
                <li key={r.id} className="flex items-center justify-between gap-3 text-sm">
                  <span className="truncate text-foreground">{r.title}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {r.last_processed_at ? new Date(r.last_processed_at).toLocaleDateString("en-IN") : "—"}
                  </span>
                </li>
              ))
            )}
          </ul>
        </GlassCard>

        <GlassCard>
          <h3 className="flex items-center gap-2 text-sm font-bold text-foreground">
            <FileText className="h-4 w-4" /> Latest Published Content
          </h3>
          <ul className="mt-3 space-y-2">
            {(data?.latestContent ?? []).length === 0 ? (
              <li className="text-xs text-muted-foreground">No content yet.</li>
            ) : (
              (data?.latestContent ?? []).map((r: any) => (
                <li key={r.id} className="flex items-center justify-between gap-3 text-sm">
                  <span className="truncate text-foreground">{r.title}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {r.created_at ? new Date(r.created_at).toLocaleDateString("en-IN") : "—"}
                  </span>
                </li>
              ))
            )}
          </ul>
        </GlassCard>
      </div>
    </div>
  );
}
