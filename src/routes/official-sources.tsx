import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BadgeCheck, ExternalLink, Search, ShieldCheck } from "lucide-react";
import { PageShell } from "@/components/layouts/PageShell";
import { Breadcrumbs } from "@/components/nav/Breadcrumbs";
import { TrustBadges } from "@/components/trust/TrustBadges";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/official-sources")({
  head: () => ({
    meta: [
      { title: "Verified Official Sources — NyayaMate AI" },
      {
        name: "description",
        content:
          "Browse the verified government portals and official public resources behind every NyayaMate AI guide, with category, verification status and last verification date.",
      },
      { property: "og:title", content: "Verified Official Sources — NyayaMate AI" },
      {
        property: "og:description",
        content: "Search verified Indian government portals with verification status and last checked date.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PublicSourcesPage,
});

type Row = {
  id: string;
  title: string;
  authority: string | null;
  category: string | null;
  jurisdiction: string | null;
  source_url: string | null;
  status: string | null;
  last_verified_at: string | null;
};

function formatDate(value: string | null) {
  if (!value) return "Not yet verified";
  return new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function PublicSourcesPage() {
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("all");

  const { data, isLoading } = useQuery({
    queryKey: ["public_official_sources"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("official_sources")
        .select("id, title, authority, category, jurisdiction, source_url, status, last_verified_at")
        .order("title");
      if (error) throw error;
      return (data ?? []) as Row[];
    },
  });

  const categories = useMemo(
    () => ["all", ...Array.from(new Set((data ?? []).map((r) => r.category).filter(Boolean) as string[])).sort()],
    [data],
  );

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return (data ?? []).filter((r) => {
      const matchesCat = category === "all" || r.category === category;
      const matchesText =
        !needle ||
        r.title.toLowerCase().includes(needle) ||
        (r.authority ?? "").toLowerCase().includes(needle) ||
        (r.jurisdiction ?? "").toLowerCase().includes(needle);
      return matchesCat && matchesText;
    });
  }, [data, q, category]);

  return (
    <PageShell>
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: "Official Sources" }]} />
        <span className="inline-flex items-center gap-2 rounded-full bg-primary-light px-3.5 py-1.5 text-xs font-semibold text-primary">
          <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" /> Source transparency
        </span>
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
          Verified Official Sources
        </h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Every guide on NyayaMate AI is traced back to an official government portal or public
          resource. Search the directory below and go straight to the source.
        </p>
        <TrustBadges className="mt-6" />

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <div className="flex flex-1 items-center gap-2 rounded-xl border border-border bg-card px-3.5 py-2.5 focus-within:border-primary">
            <Search className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <label htmlFor="source-search" className="sr-only">
              Search official sources
            </label>
            <input
              id="source-search"
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by portal, authority or state"
              className="min-h-6 flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="source-category" className="sr-only">
              Filter by category
            </label>
            <select
              id="source-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="min-h-11 w-full rounded-xl border border-border bg-card px-3.5 text-sm font-medium text-foreground focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:w-56"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c === "all" ? "All categories" : c}
                </option>
              ))}
            </select>
          </div>
        </div>

        <p role="status" className="mt-4 text-sm text-muted-foreground">
          {isLoading ? "Loading sources…" : `${rows.length} verified source${rows.length === 1 ? "" : "s"}`}
        </p>

        <ul className="mt-4 grid gap-4 md:grid-cols-2">
          {rows.map((r) => (
            <li
              key={r.id}
              className="rounded-2xl border border-border bg-card p-5 shadow-soft transition-shadow hover:shadow-card"
            >
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-base font-bold text-foreground">{r.title}</h2>
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-secondary/10 px-2.5 py-1 text-[11px] font-semibold text-secondary">
                  <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" /> Verified
                </span>
              </div>
              {r.authority && <p className="mt-1 text-sm text-muted-foreground">{r.authority}</p>}
              <dl className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                <div>
                  <dt className="font-semibold text-foreground">Category</dt>
                  <dd>{r.category ?? "General"}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-foreground">Last verified</dt>
                  <dd>{formatDate(r.last_verified_at)}</dd>
                </div>
              </dl>
              {r.source_url && (
                <a
                  href={r.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  Visit official portal
                  <ExternalLink className="h-4 w-4" aria-hidden="true" />
                  <span className="sr-only">(opens in a new tab)</span>
                </a>
              )}
            </li>
          ))}
        </ul>

        {!isLoading && rows.length === 0 && (
          <p className="mt-10 text-center text-sm text-muted-foreground">
            No sources match your search.
          </p>
        )}
      </div>
    </PageShell>
  );
}
