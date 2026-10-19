import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bookmark, FileText, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/saved")({
  head: () => ({ meta: [{ title: "Saved Items — NyayaMate AI" }] }),
  component: SavedPage,
});

function SavedPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["saved_full", user?.id],
    queryFn: async () => {
      const [savedRes, bookmarkRes] = await Promise.all([
        supabase
          .from("saved_items")
          .select("id, government_services(title, slug, category)")
          .order("created_at", { ascending: false }),
        supabase
          .from("bookmarks")
          .select("id, legal_topics(title, slug, category)")
          .order("created_at", { ascending: false }),
      ]);
      return {
        saved: savedRes.data ?? [],
        bookmarks: bookmarkRes.data ?? [],
      };
    },
    enabled: !!user,
  });

  const removeSaved = async (id: string) => {
    await supabase.from("saved_items").delete().eq("id", id);
    queryClient.invalidateQueries({ queryKey: ["saved_full", user?.id] });
    queryClient.invalidateQueries({ queryKey: ["dashboard_counts", user?.id] });
    toast.success("Removed.");
  };
  const removeBookmark = async (id: string) => {
    await supabase.from("bookmarks").delete().eq("id", id);
    queryClient.invalidateQueries({ queryKey: ["saved_full", user?.id] });
    queryClient.invalidateQueries({ queryKey: ["dashboard_counts", user?.id] });
    toast.success("Removed.");
  };

  return (
      <h2 className="text-2xl font-extrabold text-foreground">Saved Items</h2>
      <p className="mt-1 text-sm text-muted-foreground">Your saved services and bookmarked legal topics.</p>

      <div className="mt-7 grid gap-8 lg:grid-cols-2">
        <div>
          <h3 className="flex items-center gap-2 font-bold text-foreground">
            <Save className="h-4 w-4 text-primary" /> Saved Services
          </h3>
          <div className="mt-4 space-y-3">
            {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
            {data?.saved.length === 0 && (
              <EmptyState text="No saved services yet." to="/government-services" cta="Browse services" />
            )}
            {data?.saved.map((s: any) => (
              <div key={s.id} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-soft">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                  <FileText className="h-5 w-5" />
                </span>
                <Link
                  to="/government-services/$slug"
                  params={{ slug: s.government_services?.slug }}
                  className="min-w-0 flex-1"
                >
                  <p className="truncate text-sm font-semibold text-foreground">{s.government_services?.title}</p>
                  <p className="truncate text-xs text-muted-foreground">{s.government_services?.category}</p>
                </Link>
                <button onClick={() => removeSaved(s.id)} className="text-muted-foreground hover:text-destructive" aria-label="Remove">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="flex items-center gap-2 font-bold text-foreground">
            <Bookmark className="h-4 w-4 text-secondary" /> Bookmarked Topics
          </h3>
          <div className="mt-4 space-y-3">
            {data?.bookmarks.length === 0 && (
              <EmptyState text="No bookmarks yet." to="/legal-rights" cta="Browse legal topics" />
            )}
            {data?.bookmarks.map((b: any) => (
              <div key={b.id} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-soft">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-secondary/10 text-secondary">
                  <Bookmark className="h-5 w-5" />
                </span>
                <Link to="/legal-rights/$slug" params={{ slug: b.legal_topics?.slug }} className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">{b.legal_topics?.title}</p>
                  <p className="truncate text-xs text-muted-foreground">{b.legal_topics?.category}</p>
                </Link>
                <button onClick={() => removeBookmark(b.id)} className="text-muted-foreground hover:text-destructive" aria-label="Remove">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
  );
}

function EmptyState({ text, to, cta }: { text: string; to: string; cta: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center">
      <p className="text-sm text-muted-foreground">{text}</p>
      <Link to={to as any} className="mt-2 inline-block text-sm font-semibold text-primary hover:underline">
        {cta}
      </Link>
    </div>
  );
}
