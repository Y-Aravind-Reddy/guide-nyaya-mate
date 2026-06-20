import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { MessageSquare, Search, Star, Trash2, Pencil } from "lucide-react";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import {
  listConversations,
  deleteConversation,
  renameConversation,
  toggleFavorite,
} from "@/lib/conversations.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/chat-history")({
  head: () => ({
    meta: [
      { title: "Chat History — NyayaMate AI" },
      { name: "description", content: "Browse, search, and manage your AI conversations." },
    ],
  }),
  component: ChatHistoryPage,
});

function ChatHistoryPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [q, setQ] = useState("");

  const { data: conversations = [] } = useQuery({
    queryKey: ["conversations"],
    queryFn: () => listConversations(),
  });

  const filtered = conversations.filter((c) =>
    c.title.toLowerCase().includes(q.toLowerCase()),
  );

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["conversations"] });

  const remove = async (id: string) => {
    await deleteConversation({ data: { id } });
    await refresh();
    toast.success("Deleted");
  };
  const favorite = async (id: string, value: boolean) => {
    await toggleFavorite({ data: { id, value } });
    await refresh();
  };
  const rename = async (id: string, current: string) => {
    const title = window.prompt("Rename conversation", current);
    if (!title?.trim()) return;
    await renameConversation({ data: { id, title: title.trim() } });
    await refresh();
    toast.success("Renamed");
  };

  return (
    <DashboardLayout title="Chat History">
      <div className="mb-5 flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search conversations…"
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>

      <div className="space-y-2">
        {filtered.length === 0 && (
          <div className="rounded-[20px] border border-border bg-card p-10 text-center">
            <p className="text-sm text-muted-foreground">No conversations found.</p>
            <Link to="/ai-chat" className="mt-3 inline-block text-sm font-semibold text-primary hover:underline">
              Start a new chat
            </Link>
          </div>
        )}
        {filtered.map((c) => (
          <div
            key={c.id}
            className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 transition-colors hover:border-primary/40"
          >
            <button
              onClick={() => navigate({ to: "/ai-chat", search: { c: c.id } })}
              className="flex min-w-0 flex-1 items-center gap-3 text-left"
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                <MessageSquare className="h-5 w-5" />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-foreground">
                  {c.title}
                </span>
                <span className="block text-xs text-muted-foreground">
                  {new Date(c.updated_at).toLocaleString()}
                </span>
              </span>
            </button>
            <button onClick={() => favorite(c.id, !c.is_favorite)} className="rounded-md p-2 hover:bg-muted" title="Favorite">
              <Star className={cn("h-4 w-4", c.is_favorite && "fill-secondary text-secondary")} />
            </button>
            <button onClick={() => rename(c.id, c.title)} className="rounded-md p-2 hover:bg-muted" title="Rename">
              <Pencil className="h-4 w-4 text-muted-foreground" />
            </button>
            <button onClick={() => remove(c.id)} className="rounded-md p-2 hover:bg-muted" title="Delete">
              <Trash2 className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}
