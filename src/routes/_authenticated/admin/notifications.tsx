import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Gauge, BellRing, AlertOctagon, AlertTriangle, Info, CheckCircle2 } from "lucide-react";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { Button } from "@/components/ui/button";
import { adminNotifications } from "@/lib/admin-health.functions";
import { GlassCard } from "@/components/admin/health-ui";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications — NyayaMate AI" },
      { name: "description", content: "Admin notification center for system, AI, and content alerts." },
    ],
  }),
  component: NotificationsPage,
});

const SEV = {
  critical: { icon: AlertOctagon, text: "text-destructive", bg: "bg-destructive/10", border: "border-destructive/30" },
  warning: { icon: AlertTriangle, text: "text-accent", bg: "bg-accent/10", border: "border-accent/30" },
  info: { icon: Info, text: "text-primary", bg: "bg-primary/10", border: "border-primary/30" },
} as const;

function NotificationsPage() {
  const { isAdmin, isLoading: adminLoading } = useIsAdmin();
  const navigate = useNavigate();
  const fetchFn = useServerFn(adminNotifications);
  const { data } = useQuery({
    queryKey: ["admin_notifications"],
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

  const notifications = data?.notifications ?? [];

  return (
      <div>
        <h2 className="text-2xl font-extrabold text-foreground sm:text-3xl">Notification Center</h2>
        <p className="mt-1 max-w-xl text-sm text-muted-foreground">
          Live alerts for KB sync, embeddings, official sources, usage, and content health.
        </p>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-4">
        <GlassCard className="text-center">
          <p className="text-2xl font-extrabold text-destructive">{data?.counts.critical ?? 0}</p>
          <p className="text-xs text-muted-foreground">Critical</p>
        </GlassCard>
        <GlassCard className="text-center">
          <p className="text-2xl font-extrabold text-accent">{data?.counts.warning ?? 0}</p>
          <p className="text-xs text-muted-foreground">Warnings</p>
        </GlassCard>
        <GlassCard className="text-center">
          <p className="text-2xl font-extrabold text-primary">{data?.counts.info ?? 0}</p>
          <p className="text-xs text-muted-foreground">Info</p>
        </GlassCard>
      </div>

      <div className="mt-6 space-y-3">
        {notifications.length === 0 ? (
          <GlassCard className="flex items-center gap-3">
            <CheckCircle2 className="h-6 w-6 text-secondary" />
            <div>
              <p className="font-semibold text-foreground">All clear</p>
              <p className="text-sm text-muted-foreground">No active alerts. Everything looks healthy.</p>
            </div>
          </GlassCard>
        ) : (
          notifications.map((n) => {
            const s = SEV[n.severity];
            const Icon = s.icon;
            return (
              <div
                key={n.id}
                className={cn("flex items-start gap-3 rounded-[20px] border bg-card/70 p-4 shadow-card backdrop-blur-xl", s.border)}
              >
                <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-xl", s.bg, s.text)}>
                  <Icon className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="font-semibold text-foreground">{n.title}</p>
                  <p className="text-sm text-muted-foreground">{n.detail}</p>
                </div>
              </div>
            );
          })
        )}
      </div>

      <p className="mt-6 flex items-center gap-1.5 text-xs text-muted-foreground">
        <BellRing className="h-3.5 w-3.5" /> Alerts refresh automatically from live system metrics.
      </p>
  );
}
