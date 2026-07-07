import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { Gauge, Users, UserCheck, Sparkles, Timer, Search, Percent, TrendingUp } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { Button } from "@/components/ui/button";
import { adminAnalyticsReport } from "@/lib/admin-health.functions";
import { GlassCard, MetricCard } from "@/components/admin/health-ui";

export const Route = createFileRoute("/_authenticated/admin/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics — NyayaMate AI" },
      { name: "description", content: "Usage, engagement, and AI analytics for NyayaMate AI." },
    ],
  }),
  component: AnalyticsPage,
});

function RankList({ title, items }: { title: string; items: { label: string; value: number }[] }) {
  return (
    <GlassCard>
      <h3 className="text-sm font-bold text-foreground">{title}</h3>
      {items.length === 0 ? (
        <p className="mt-3 text-xs text-muted-foreground">No data yet.</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {items.map((it, i) => (
            <li key={`${it.label}-${i}`} className="flex items-center justify-between gap-3 text-sm">
              <span className="flex min-w-0 items-center gap-2">
                <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
                  {i + 1}
                </span>
                <span className="truncate text-foreground">{it.label}</span>
              </span>
              {it.value > 0 ? (
                <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">
                  {it.value}
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </GlassCard>
  );
}

function AnalyticsPage() {
  const { isAdmin, isLoading: adminLoading } = useIsAdmin();
  const navigate = useNavigate();
  const fetchFn = useServerFn(adminAnalyticsReport);
  const { data } = useQuery({
    queryKey: ["admin_analytics"],
    queryFn: () => fetchFn(),
    enabled: isAdmin,
    staleTime: 60_000,
  });

  if (!adminLoading && !isAdmin) {
    return (
      <DashboardLayout title="Analytics">
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

  return (
    <DashboardLayout title="Analytics">
      <div>
        <h2 className="text-2xl font-extrabold text-foreground sm:text-3xl">Analytics</h2>
        <p className="mt-1 max-w-xl text-sm text-muted-foreground">
          Platform usage, AI performance, and content engagement.
        </p>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Total Users" value={data?.totalUsers ?? 0} icon={Users} />
        <MetricCard label="Daily Active Users" value={data?.dau ?? 0} icon={UserCheck} />
        <MetricCard label="AI Requests Today" value={data?.aiRequestsToday ?? 0} icon={Sparkles} />
        <MetricCard label="Monthly AI Requests" value={data?.monthlyAiRequests ?? 0} icon={Sparkles} />
        <MetricCard label="Avg AI Response" value={`${((data?.avgAiResponseMs ?? 0) / 1000).toFixed(1)}s`} icon={Timer} />
        <MetricCard label="Avg Search Time" value={`${data?.avgSearchMs ?? 0}ms`} icon={Search} />
        <MetricCard label="Search Success Rate" value={`${data?.searchSuccessRate ?? 0}%`} icon={Percent} />
        <MetricCard label="Knowledge Growth (14d)" value={(data?.knowledgeGrowth ?? []).reduce((s, d) => s + d.count, 0)} icon={TrendingUp} />
      </div>

      <GlassCard className="mt-6">
        <h3 className="text-sm font-bold text-foreground">Knowledge Growth Trend</h3>
        <div className="mt-4 h-56">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data?.knowledgeGrowth ?? []}>
              <defs>
                <linearGradient id="kg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(d) => String(d).slice(5)} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={28} />
              <Tooltip />
              <Area type="monotone" dataKey="count" stroke="hsl(var(--primary))" fill="url(#kg)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <RankList title="Popular Government Services" items={data?.popularServices ?? []} />
        <RankList title="Popular Legal Topics" items={data?.popularTopics ?? []} />
        <RankList title="Most Viewed Schemes" items={data?.popularSchemes ?? []} />
        <RankList title="Top AI Questions" items={data?.topAiQuestions ?? []} />
        <RankList title="Most Common Searches" items={data?.mostCommonSearches ?? []} />
        <RankList title="Top FAQs" items={data?.topFaqs ?? []} />
        <RankList title="Top Glossary Terms" items={data?.topGlossary ?? []} />
      </div>
    </DashboardLayout>
  );
}
