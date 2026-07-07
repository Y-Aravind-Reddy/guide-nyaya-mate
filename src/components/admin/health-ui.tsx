import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export type Health = "healthy" | "warning" | "critical";

export function healthOf(value: number, good: number, warn: number): Health {
  if (value >= good) return "healthy";
  if (value >= warn) return "warning";
  return "critical";
}

const HEALTH_STYLES: Record<Health, { dot: string; text: string; bg: string; bar: string; label: string }> = {
  healthy: { dot: "bg-secondary", text: "text-secondary", bg: "bg-secondary/10", bar: "bg-secondary", label: "Healthy" },
  warning: { dot: "bg-accent", text: "text-accent", bg: "bg-accent/10", bar: "bg-accent", label: "Warning" },
  critical: { dot: "bg-destructive", text: "text-destructive", bg: "bg-destructive/10", bar: "bg-destructive", label: "Critical" },
};

/** Glass card container reused across admin health pages. */
export function GlassCard({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "rounded-[20px] border border-border bg-card/70 p-5 shadow-card backdrop-blur-xl",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function StatusDot({ health }: { health: Health }) {
  const s = HEALTH_STYLES[health];
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold", s.bg, s.text)}>
      <span className={cn("h-2 w-2 rounded-full", s.dot)} />
      {s.label}
    </span>
  );
}

export function MetricCard({
  label,
  value,
  icon: Icon,
  health,
  hint,
}: {
  label: string;
  value: ReactNode;
  icon?: LucideIcon;
  health?: Health;
  hint?: string;
}) {
  return (
    <GlassCard className="p-5">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {Icon ? <Icon className="h-4 w-4" /> : null}
          <span>{label}</span>
        </div>
        {health ? <StatusDot health={health} /> : null}
      </div>
      <p className="mt-3 text-2xl font-extrabold text-foreground">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </GlassCard>
  );
}

export function ProgressBar({ value, health }: { value: number; health?: Health }) {
  const h = health ?? healthOf(value, 75, 45);
  const s = HEALTH_STYLES[h];
  return (
    <div className="h-2 overflow-hidden rounded-full bg-muted">
      <div className={cn("h-full rounded-full transition-all", s.bar)} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  );
}

export function CheckIcon({ status }: { status: "pass" | "warn" | "fail" }) {
  if (status === "pass") return <CheckCircle2 className="h-4 w-4 shrink-0 text-secondary" />;
  if (status === "warn") return <AlertTriangle className="h-4 w-4 shrink-0 text-accent" />;
  return <XCircle className="h-4 w-4 shrink-0 text-destructive" />;
}

export function ScoreRing({ score, label }: { score: number; label?: string }) {
  const h = healthOf(score, 75, 45);
  const s = HEALTH_STYLES[h];
  return (
    <div className="flex items-center gap-5">
      <div className={cn("grid h-24 w-24 place-items-center rounded-full", s.bg)}>
        <span className={cn("text-3xl font-extrabold", s.text)}>{score}</span>
      </div>
      <div>
        <p className="text-sm text-muted-foreground">{label ?? "Overall Score"}</p>
        <p className={cn("text-xl font-bold", s.text)}>{s.label}</p>
      </div>
    </div>
  );
}
