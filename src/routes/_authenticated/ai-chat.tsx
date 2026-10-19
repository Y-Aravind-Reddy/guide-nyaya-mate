import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import type { UIMessage } from "ai";
import { MessageSquarePlus, MessageSquare, Star, Trash2 } from "lucide-react";
import { z } from "zod";
import { ChatPanel } from "@/components/ai/ChatPanel";
import {
  getConversation,
  listConversations,
  deleteConversation,
  toggleFavorite,
  type MessageRow,
} from "@/lib/conversations.functions";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const SUGGESTIONS = [
  "How do I apply for a Passport?",
  "How do I file an FIR?",
  "What documents are needed for a PAN Card?",
  "How do I register property?",
  "What are consumer rights?",
  "How do I apply for an Income Certificate?",
];

export const Route = createFileRoute("/_authenticated/ai-chat")({
  validateSearch: z.object({ c: z.string().uuid().optional() }),
  head: () => ({
    meta: [
      { title: "AI Chat — NyayaMate AI" },
      {
        name: "description",
        content:
          "Chat with NyayaMate AI for educational guidance on Indian legal rights and government services.",
      },
    ],
  }),
  component: AiChatPage,
});

function rowsToUIMessages(rows: MessageRow[]): UIMessage[] {
  return rows
    .filter((r) => r.role !== "system")
    .map((r) => ({
      id: r.id,
      role: r.role as "user" | "assistant",
      parts: [{ type: "text", text: r.content }],
    }));
}

function AiChatPage() {
  const { c: activeId } = Route.useSearch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: conversations = [] } = useQuery({
    queryKey: ["conversations"],
    queryFn: () => listConversations(),
  });

  const { data: messageRows } = useQuery({
    queryKey: ["conversation", activeId],
    queryFn: () => getConversation({ data: { id: activeId! } }),
    enabled: !!activeId,
  });

  const initialMessages = useMemo(
    () => (messageRows ? rowsToUIMessages(messageRows) : undefined),
    [messageRows],
  );

  const openConversation = (id?: string) =>
    navigate({ to: "/ai-chat", search: id ? { c: id } : {} });

  const remove = async (id: string) => {
    await deleteConversation({ data: { id } });
    await queryClient.invalidateQueries({ queryKey: ["conversations"] });
    if (id === activeId) openConversation(undefined);
    toast.success("Conversation deleted");
  };

  const favorite = async (id: string, value: boolean) => {
    await toggleFavorite({ data: { id, value } });
    await queryClient.invalidateQueries({ queryKey: ["conversations"] });
  };

  // Key the panel so it remounts per thread (and on "new chat")
  const panelKey = activeId ?? "new";

  return (
      <div className="grid h-[calc(100vh-9rem)] gap-5 lg:grid-cols-[280px_1fr]">
        <aside className="hidden flex-col rounded-[20px] border border-border bg-card p-3 lg:flex">
          <button
            onClick={() => openConversation(undefined)}
            className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            <MessageSquarePlus className="h-4 w-4" /> New chat
          </button>
          <div className="mt-3 flex-1 space-y-1 overflow-y-auto">
            {conversations.length === 0 && (
              <p className="px-2 py-4 text-xs text-muted-foreground">
                No conversations yet. Start a new chat.
              </p>
            )}
            {conversations.map((conv) => (
              <div
                key={conv.id}
                className={cn(
                  "group flex items-center gap-1 rounded-lg px-2 py-2 text-sm transition-colors",
                  conv.id === activeId
                    ? "bg-primary/10 text-foreground"
                    : "text-muted-foreground hover:bg-muted",
                )}
              >
                <button
                  onClick={() => openConversation(conv.id)}
                  className="flex min-w-0 flex-1 items-center gap-2 text-left"
                >
                  <MessageSquare className="h-4 w-4 shrink-0" />
                  <span className="truncate">{conv.title}</span>
                </button>
                <button
                  onClick={() => favorite(conv.id, !conv.is_favorite)}
                  className="opacity-0 transition-opacity group-hover:opacity-100"
                  title="Favorite"
                >
                  <Star
                    className={cn(
                      "h-3.5 w-3.5",
                      conv.is_favorite && "fill-secondary text-secondary",
                    )}
                  />
                </button>
                <button
                  onClick={() => remove(conv.id)}
                  className="opacity-0 transition-opacity group-hover:opacity-100"
                  title="Delete"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </aside>

        <div className="rounded-[20px] border border-border bg-card p-4">
          <ChatPanel
            key={panelKey}
            conversationId={activeId}
            initialMessages={initialMessages}
            suggestions={SUGGESTIONS}
          />
        </div>
      </div>
  );
}
