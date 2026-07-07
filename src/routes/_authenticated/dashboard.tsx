import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, useQuery } from "@tanstack/react-query";
import {
  Bookmark,
  BookOpen,
  ChevronRight,
  FileText,
  Save,
  TrendingUp,
} from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { AdminWidgets } from "@/components/admin/AdminWidgets";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { servicesQuery } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — NyayaMate AI" },
      { name: "description", content: "Your NyayaMate AI dashboard for legal and government guidance." },
    ],
  }),
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(servicesQuery());
  },
  component: DashboardPage,
});

function DashboardPage() {
  const { user } = useAuth();
  const { isAdmin } = useIsAdmin();
  const { data: services } = useSuspenseQuery(servicesQuery());

  const { data: counts } = useQuery({
    queryKey: ["dashboard_counts", user?.id],
    queryFn: async () => {
      const [saved, bookmarks] = await Promise.all([
        supabase.from("saved_items").select("id", { count: "exact", head: true }),
        supabase.from("bookmarks").select("id", { count: "exact", head: true }),
      ]);
      return { saved: saved.count ?? 0, bookmarks: bookmarks.count ?? 0 };
    },
  });

  const name =
    (user?.user_metadata?.full_name as string | undefined)?.split(" ")[0] ??
    user?.email?.split("@")[0] ??
    "there";

  const stats = [
    { label: "Services Available", value: services.length, change: "Live", icon: BookOpen, bg: "bg-primary/10", tint: "text-primary" },
    { label: "Saved Items", value: counts?.saved ?? 0, change: "Yours", icon: Save, bg: "bg-secondary/10", tint: "text-secondary" },
    { label: "Bookmarks", value: counts?.bookmarks ?? 0, change: "Yours", icon: Bookmark, bg: "bg-accent/10", tint: "text-accent" },
    { label: "Categories", value: new Set(services.map((s) => s.category)).size, change: "Explore", icon: FileText, bg: "bg-primary/10", tint: "text-primary" },
  ];

  return (
    <DashboardLayout title="Dashboard">
      <div className="relative overflow-hidden rounded-[24px] bg-navy p-7 text-white shadow-premium sm:p-9">
        <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-secondary/20 blur-3xl" />
        <div className="relative">
          <h2 className="text-2xl font-extrabold sm:text-3xl">Welcome back, {name} 👋</h2>
          <p className="mt-2 max-w-lg text-white/70">
            Explore government services and legal topics, and save the guides you need.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            {services.slice(0, 6).map((q) => (
              <Link
                key={q.id}
                to="/government-services/$slug"
                params={{ slug: q.slug }}
                className="rounded-full bg-white/10 px-4 py-1.5 text-xs font-semibold backdrop-blur transition-colors hover:bg-white/20"
              >
                {q.title}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-[20px] border border-border bg-card p-5 shadow-card">
            <div className="flex items-center justify-between">
              <span className={`grid h-11 w-11 place-items-center rounded-2xl ${s.bg} ${s.tint}`}>
                <s.icon className="h-5 w-5" />
              </span>
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-secondary">
                <TrendingUp className="h-3.5 w-3.5" /> {s.change}
              </span>
            </div>
            <p className="mt-4 text-3xl font-extrabold text-foreground">{s.value}</p>
            <p className="mt-1 text-sm text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-7 grid gap-6 lg:grid-cols-3">
        <div className="rounded-[20px] border border-border bg-card p-6 shadow-card lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-foreground">Featured Services</h2>
            <Link to="/government-services" className="text-sm font-semibold text-primary hover:underline">
              View all
            </Link>
          </div>
          <div className="mt-5 space-y-3">
            {services.slice(0, 5).map((r) => (
              <Link
                key={r.id}
                to="/government-services/$slug"
                params={{ slug: r.slug }}
                className="flex items-center gap-4 rounded-2xl border border-border bg-background p-4 transition-colors hover:border-primary/40"
              >
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                  <FileText className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">{r.title}</p>
                  <p className="truncate text-xs text-muted-foreground">{r.category}</p>
                </div>
                <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-[20px] border border-border bg-card p-6 shadow-card">
          <h2 className="text-lg font-bold text-foreground">Quick Access</h2>
          <div className="mt-5 space-y-2.5">
            <Link to="/legal-rights" className="flex w-full items-center justify-between rounded-xl border border-border bg-background px-4 py-3 text-left text-sm font-medium text-foreground transition-colors hover:border-primary/40">
              Legal Topics <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Link>
            <Link to="/saved" className="flex w-full items-center justify-between rounded-xl border border-border bg-background px-4 py-3 text-left text-sm font-medium text-foreground transition-colors hover:border-primary/40">
              Saved Items <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Link>
            <Link to="/profile" className="flex w-full items-center justify-between rounded-xl border border-border bg-background px-4 py-3 text-left text-sm font-medium text-foreground transition-colors hover:border-primary/40">
              Edit Profile <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Link>
            <Link to="/settings" className="flex w-full items-center justify-between rounded-xl border border-border bg-background px-4 py-3 text-left text-sm font-medium text-foreground transition-colors hover:border-primary/40">
              Settings <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Link>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
