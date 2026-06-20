import { ShieldAlert } from "lucide-react";
import { DISCLAIMER } from "@/lib/ai-prompts";

export function AiDisclaimer({ className = "" }: { className?: string }) {
  return (
    <div
      className={`flex items-start gap-2 rounded-xl border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground ${className}`}
    >
      <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-secondary" />
      <span>{DISCLAIMER}</span>
    </div>
  );
}
