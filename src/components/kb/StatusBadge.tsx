import { cn } from "@/lib/utils";

const MAP: Record<string, { label: string; dot: string; cls: string }> = {
  processed: {
    label: "Processed",
    dot: "bg-secondary",
    cls: "bg-secondary/10 text-secondary border-secondary/20",
  },
  processing: {
    label: "Processing",
    dot: "bg-accent",
    cls: "bg-accent/10 text-accent border-accent/20",
  },
  failed: {
    label: "Failed",
    dot: "bg-destructive",
    cls: "bg-destructive/10 text-destructive border-destructive/20",
  },
  pending: {
    label: "Pending",
    dot: "bg-muted-foreground",
    cls: "bg-muted text-muted-foreground border-border",
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
