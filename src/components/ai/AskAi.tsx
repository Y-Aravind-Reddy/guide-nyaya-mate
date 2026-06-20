import { useState } from "react";
import { Sparkles, ChevronDown } from "lucide-react";
import { ChatPanel } from "@/components/ai/ChatPanel";
import { cn } from "@/lib/utils";

type Props = {
  contextType: "government-service" | "legal-topic";
  contextSlug: string;
  title: string;
  suggestions?: string[];
};

export function AskAi({ contextType, contextSlug, title, suggestions }: Props) {
  const [open, setOpen] = useState(false);
  const label =
    contextType === "government-service"
      ? "Ask AI about this service"
      : "Ask AI about this topic";

  return (
    <div className="rounded-[20px] border border-border bg-card shadow-card">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 p-5 text-left"
      >
        <span className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/10 text-primary">
            <Sparkles className="h-5 w-5" />
          </span>
          <span>
            <span className="block text-base font-bold text-foreground">{label}</span>
            <span className="block text-sm text-muted-foreground">
              Get instant, plain-language answers about {title}.
            </span>
          </span>
        </span>
        <ChevronDown className={cn("h-5 w-5 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="border-t border-border p-4">
          <div className="h-[460px]">
            <ChatPanel
              contextType={contextType}
              contextSlug={contextSlug}
              suggestions={suggestions}
              compact
              placeholder={`Ask about ${title}…`}
            />
          </div>
        </div>
      )}
    </div>
  );
}
