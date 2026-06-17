import { Scale } from "lucide-react";
import { cn } from "@/lib/utils";

export function Logo({ className, light = false }: { className?: string; light?: boolean }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div className="relative grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary shadow-soft">
        <Scale className="h-5 w-5 text-primary-foreground" strokeWidth={2.2} />
        <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-secondary ring-2 ring-card" />
      </div>
      <div className="flex flex-col leading-none">
        <span className={cn("text-lg font-extrabold tracking-tight", light ? "text-white" : "text-foreground")}>
          NyayaMate <span className="text-secondary">AI</span>
        </span>
        <span className={cn("text-[10px] font-medium tracking-wide", light ? "text-white/60" : "text-muted-foreground")}>
          Legal & Govt Guidance
        </span>
      </div>
    </div>
  );
}
