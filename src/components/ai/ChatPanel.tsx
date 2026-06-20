import { useEffect, useMemo, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Check,
  Copy,
  RefreshCw,
  Send,
  ThumbsDown,
  ThumbsUp,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AiDisclaimer } from "@/components/ai/AiDisclaimer";
import { useAuth } from "@/hooks/useAuth";
import { submitFeedback } from "@/lib/conversations.functions";

function messageText(m: UIMessage): string {
  return m.parts.map((p) => (p.type === "text" ? p.text : "")).join("");
}

function Markdown({ children }: { children: string }) {
  return (
    <div className="prose prose-sm max-w-none prose-headings:font-bold prose-headings:text-foreground prose-p:text-foreground/90 prose-li:text-foreground/90 prose-strong:text-foreground prose-a:text-primary">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{children}</ReactMarkdown>
    </div>
  );
}

type Props = {
  conversationId?: string;
  initialMessages?: UIMessage[];
  contextType?: "government-service" | "legal-topic";
  contextSlug?: string;
  suggestions?: string[];
  compact?: boolean;
  placeholder?: string;
};

export function ChatPanel({
  conversationId,
  initialMessages,
  contextType,
  contextSlug,
  suggestions = [],
  compact = false,
  placeholder = "Ask about any law or government service…",
}: Props) {
  const { session } = useAuth();
  const token = session?.access_token;
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: { conversationId, contextType, contextSlug },
      }),
    [token, conversationId, contextType, contextSlug],
  );

  const { messages, sendMessage, status, regenerate, error } = useChat({
    id: conversationId ?? `${contextType ?? "main"}-${contextSlug ?? "chat"}`,
    messages: initialMessages,
    transport,
  });

  const isLoading = status === "submitted" || status === "streaming";

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, status]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [conversationId]);

  useEffect(() => {
    if (error) toast.error("The assistant ran into an issue. Please try again.");
  }, [error]);

  const handleSend = (text: string) => {
    const value = text.trim();
    if (!value || isLoading) return;
    if (!token) {
      toast.error("Please sign in to chat with NyayaMate AI.");
      return;
    }
    sendMessage({ text: value });
    setInput("");
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const copy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const feedback = async (rating: "up" | "down") => {
    try {
      await submitFeedback({ data: { rating } });
      toast.success("Thanks for your feedback!");
    } catch {
      toast.error("Could not save feedback");
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 space-y-5 overflow-y-auto px-1 py-2">
        {messages.length === 0 && (
          <div className="mx-auto max-w-xl py-8 text-center">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary">
              <Sparkles className="h-7 w-7" />
            </span>
            <h3 className="mt-4 text-lg font-bold text-foreground">
              How can I help you today?
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Ask about Indian legal rights, government services, documents, and procedures.
            </p>
          </div>
        )}

        {messages.map((m) => {
          const text = messageText(m);
          if (m.role === "user") {
            return (
              <div key={m.id} className="flex justify-end">
                <div className="max-w-[85%] rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-sm text-primary-foreground">
                  {text}
                </div>
              </div>
            );
          }
          return (
            <div key={m.id} className="flex flex-col gap-2">
              <Markdown>{text}</Markdown>
              {!isLoading && (
                <div className="flex items-center gap-1 text-muted-foreground">
                  <button
                    onClick={() => copy(text)}
                    className="rounded-md p-1.5 hover:bg-muted"
                    title="Copy"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => regenerate()}
                    className="rounded-md p-1.5 hover:bg-muted"
                    title="Regenerate"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => feedback("up")}
                    className="rounded-md p-1.5 hover:bg-muted"
                    title="Helpful"
                  >
                    <ThumbsUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => feedback("down")}
                    className="rounded-md p-1.5 hover:bg-muted"
                    title="Not helpful"
                  >
                    <ThumbsDown className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {status === "submitted" && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:-0.3s]" />
            <span className="h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:-0.15s]" />
            <span className="h-2 w-2 animate-bounce rounded-full bg-primary" />
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {messages.length === 0 && suggestions.length > 0 && (
        <div className="flex flex-wrap gap-2 px-1 py-2">
          {suggestions.map((s) => (
            <button
              key={s}
              onClick={() => handleSend(s)}
              className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-primary/5"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <div className="mt-2 space-y-2">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend(input);
          }}
          className="flex items-end gap-2 rounded-2xl border border-border bg-card p-2 shadow-card"
        >
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend(input);
              }
            }}
            rows={compact ? 1 : 2}
            placeholder={placeholder}
            className="max-h-40 flex-1 resize-none bg-transparent px-2 py-1.5 text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
          <Button
            type="submit"
            size="icon"
            disabled={isLoading || !input.trim()}
            className="h-9 w-9 shrink-0 rounded-xl"
          >
            {isLoading ? (
              <Check className="h-4 w-4" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
        <AiDisclaimer />
      </div>
    </div>
  );
}
