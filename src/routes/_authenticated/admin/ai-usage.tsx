import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Activity,
  AlertTriangle,
  CalendarDays,
  Coins,
  Cpu,
  Gauge,
  Loader2,
  ShieldAlert,
  Timer,
  Download,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { adminAiUsage } from "@/lib/ai-usage.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/ai-usage")({
  head: () => ({
    meta: [{ title: "AI Usage — NyayaMate AI" }],
  }),
  component: AiUsagePage,
});

function AiUsagePage() {
  const { isAdmin, isLoading } = useIsAdmin();
  const usageFn = useServerFn(adminAiUsage);
  const { data, isLoading: loadingData } = useQuery({
    queryKey: ["admin-ai-usage"],
    queryFn: () => usageFn(),
    enabled: isAdmin,
  });
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "failed" | "rate_limited">("all");

  const filteredEvents = useMemo(() => {
    const evs = data?.events ?? [];
    return evs.filter((e) => {
      if (filter === "failed" && !(!e.rateLimited && !e.succeeded)) return false;
      if (filter === "rate_limited" && !e.rateLimited) return false;
      if (q && !`${e.userId ?? ""} ${e.model ?? ""}`.toLowerCase().includes(q.toLowerCase()))
        return false;
      return true;
    });
  }, [data, q, filter]);

  const exportCsv = () => {
    const rows = [
      ["id", "user_id", "type", "model", "tokens", "response_ms", "succeeded", "rate_limited", "cost", "created_at"],
      ...filteredEvents.map((e) => [
        e.id, e.userId ?? "", e.eventType, e.model ?? "", e.totalTokens,
        e.responseTimeMs, e.succeeded, e.rateLimited, e.costEstimate, e.createdAt,
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c)}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `ai-usage-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <DashboardLayout title="AI Usage">
        <div className="grid place-items-center py-24">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }
  if (!isAdmin) {
    return (
      <DashboardLayout title="AI Usage">
        <div className="rounded-2xl border border-border bg-card p-10 text-center">
          <p className="text-sm text-muted-foreground">Admin access required.</p>
        </div>
      </DashboardLayout>
    );
  }

  const s = data?.summary;

  return (
    <DashboardLayout title="AI Usage">
      <div className="space-y-6">
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-bold text-foreground">
            <Gauge className="h-6 w-6 text-primary" /> AI Usage Dashboard
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Monitoring for AI chat usage, cost and rate limiting (last 30 days).
          </p>
        </div>

        {loadingData || !s ? (
          <div className="grid place-items-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
              <Stat icon={Activity} label="Today's Requests" value={s.todayRequests} tone="text-primary" />
              <Stat icon={CalendarDays} label="Monthly Requests" value={s.monthRequests} tone="text-foreground" />
              <Stat icon={Timer} label="Avg Response" value={`${s.avgResponseMs} ms`} tone="text-secondary" />
              <Stat icon={Cpu} label="Tokens Used" value={s.totalTokens.toLocaleString()} tone="text-foreground" />
              <Stat icon={Cpu} label="Embedding Requests" value={s.embeddingRequests} tone="text-foreground" />
              <Stat icon={AlertTriangle} label="Failed Requests" value={s.failedRequests} tone="text-destructive" />
              <Stat icon={ShieldAlert} label="Rate Limit Hits" value={s.rateLimitHits} tone="text-accent" />
              <Stat icon={Coins} label="Avg Cost (est)" value={`${s.avgCost}`} tone="text-foreground" />
              <Stat icon={Coins} label="Total Cost (est)" value={`${s.totalCost}`} tone="text-foreground" />
            </div>

            {/* Trend */}
            <div className="rounded-2xl border border-border bg-card p-5">
              <p className="mb-3 font-semibold text-foreground">AI Usage Trend (14 days)</p>
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data?.trend ?? []}>
                    <defs>
                      <linearGradient id="usageFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(d) => d.slice(5)} />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip />
                    <Area type="monotone" dataKey="count" stroke="hsl(var(--primary))" fill="url(#usageFill)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Top users */}
            <div className="rounded-2xl border border-border bg-card p-5">
              <p className="mb-3 font-semibold text-foreground">Top Users</p>
              {(data?.topUsers ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground">No usage yet.</p>
              ) : (
                <div className="divide-y divide-border">
                  {data!.topUsers.map((u) => (
                    <div key={u.userId} className="flex items-center justify-between py-2 text-sm">
                      <span className="truncate text-foreground">{u.name || u.email || u.userId}</span>
                      <span className="text-muted-foreground">
                        {u.requests} req · {u.tokens.toLocaleString()} tokens
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Events table */}
            <div className="rounded-2xl border border-border bg-card p-5">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold text-foreground">Recent Events</p>
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Search user / model…"
                    className="rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-foreground"
                  />
                  <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value as any)}
                    className="rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-foreground"
                  >
                    <option value="all">All</option>
                    <option value="failed">Failed</option>
                    <option value="rate_limited">Rate limited</option>
                  </select>
                  <button
                    onClick={exportCsv}
                    className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-semibold text-foreground hover:bg-muted"
                  >
                    <Download className="h-3.5 w-3.5" /> Export CSV
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="text-muted-foreground">
                    <tr className="border-b border-border">
                      <th className="py-2 pr-3">When</th>
                      <th className="py-2 pr-3">Model</th>
                      <th className="py-2 pr-3">Tokens</th>
                      <th className="py-2 pr-3">Resp</th>
                      <th className="py-2 pr-3">Cost</th>
                      <th className="py-2 pr-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEvents.slice(0, 100).map((e) => (
                      <tr key={e.id} className="border-b border-border/60 text-foreground">
                        <td className="py-2 pr-3 whitespace-nowrap">
                          {new Date(e.createdAt).toLocaleString("en-IN")}
                        </td>
                        <td className="py-2 pr-3">{e.model ?? "—"}</td>
                        <td className="py-2 pr-3">{e.totalTokens}</td>
                        <td className="py-2 pr-3">{e.responseTimeMs} ms</td>
                        <td className="py-2 pr-3">{e.costEstimate}</td>
                        <td className="py-2 pr-3">
                          <span
                            className={cn(
                              "rounded-full px-2 py-0.5 text-[11px] font-semibold",
                              e.rateLimited
                                ? "bg-accent/10 text-accent"
                                : e.succeeded
                                  ? "bg-secondary/10 text-secondary"
                                  : "bg-destructive/10 text-destructive",
                            )}
                          >
                            {e.rateLimited ? "Rate limited" : e.succeeded ? "OK" : "Failed"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Activity;
  label: string;
  value: string | number;
  tone: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <Icon className={cn("h-4 w-4", tone)} /> {label}
      </div>
      <p className={cn("mt-2 text-xl font-bold", tone)}>{value}</p>
    </div>
  );
}
