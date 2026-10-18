import { cn } from "@/lib/utils";

const MAP: Record<string, { label: string; dot: string; cls: string }> = {
  processed: {
    label: "Processed",
    dot: "bg-status-verified",
    cls: "bg-status-verified/10 text-status-verified border-status-verified/20",
  },
  processing: {
    label: "Processing",
    dot: "bg-status-info",
    cls: "bg-status-info/10 text-status-info border-status-info/20",
  },
  failed: {
    label: "Failed",
    dot: "bg-status-broken",
    cls: "bg-status-broken/10 text-status-broken border-status-broken/20",
  },
  pending: {
    label: "Pending",
    dot: "bg-status-draft",
    cls: "bg-muted text-status-draft border-border",
  },
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const s = MAP[status] ?? MAP.pending;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        s.cls,
        className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", s.dot)} />
      {s.label}
    </span>
  );
}
