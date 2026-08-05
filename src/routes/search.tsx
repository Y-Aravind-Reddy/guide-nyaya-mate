import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  Search as SearchIcon,
  Landmark,
  BookOpen,
  Trophy,
  HelpCircle,
  BookA,
  Clock,
  X,
} from "lucide-react";
import { PageShell } from "@/components/layouts/PageShell";
import { globalSearch, type SearchResult } from "@/lib/search.functions";
import { cn } from "@/lib/utils";

const searchSchema = z.object({
  q: z.string().optional(),
  type: z.string().optional(),
  category: z.string().optional(),
  sort: z.enum(["relevance", "newest", "popularity"]).optional(),
  page: z.number().optional(),
});

const TYPE_META: Record<string, { icon: typeof Landmark; label: string }> = {
  government_services: { icon: Landmark, label: "Government Services" },
  legal_topics: { icon: BookOpen, label: "Legal Topics" },
  schemes: { icon: Trophy, label: "Schemes" },
  faqs: { icon: HelpCircle, label: "FAQs" },
  glossary: { icon: BookA, label: "Glossary" },
};
const TYPE_KEYS = Object.keys(TYPE_META);
const RECENT_KEY = "nyayamate-recent-searches";

export const Route = createFileRoute("/search")({
  validateSearch: (s) => searchSchema.parse(s),
  head: () => ({
    meta: [
      { title: "Search — NyayaMate AI" },
      {
        name: "description",
        content:
          "Search across government services, legal topics, schemes, FAQs and the legal glossary on NyayaMate AI.",
      },
    ],
    links: [{ rel: "canonical", href: "https://guide-nyaya-mate.lovable.app/search" }],
  }),
  component: SearchPage,
});

function highlight(text: string, q: string) {
  if (!q) return text;
  const idx = text.toLowerCase().indexOf(q.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="rounded bg-accent/25 px-0.5 text-foreground">
        {text.slice(idx, idx + q.length)}
      </mark>
      {text.slice(idx + q.length)}
    </>
  );
}

function SearchPage() {
  const sp = Route.useSearch();
  const navigate = useNavigate({ from: "/search" });
  const [input, setInput] = useState(sp.q ?? "");
  const [debounced, setDebounced] = useState(sp.q ?? "");
  const [recent, setRecent] = useState<string[]>([]);
  const searchFn = useServerFn(globalSearch);

  const type = sp.type ?? "";
  const category = sp.category ?? "";
  const sort = sp.sort ?? "relevance";
  const page = sp.page ?? 1;
  const pageSize = 12;

  useEffect(() => {
    try {
      setRecent(JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]"));
    } catch {
      /* ignore */
    }
  }, []);

  // Debounce the input into the URL query.
  const first = useRef(true);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(input), 300);
    return () => clearTimeout(t);
  }, [input]);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    navigate({ search: (p: any) => ({ ...p, q: debounced || undefined, page: undefined }) });
  }, [debounced, navigate]);

  const saveRecent = (q: string) => {
    if (!q.trim()) return;
    const next = [q, ...recent.filter((r) => r !== q)].slice(0, 6);
    setRecent(next);
    try {
      localStorage.setItem(RECENT_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  };

  const { data, isFetching } = useQuery({
    queryKey: ["global-search", debounced, type, category, sort, page],
    queryFn: () =>
      searchFn({
        data: {
          q: debounced,
          types: type ? [type] : undefined,
          category: category || undefined,
          sort,
          page,
          pageSize,
        },
      }),
    enabled: debounced.trim().length > 0,
  });

  useEffect(() => {
    if (debounced.trim()) saveRecent(debounced.trim());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const results = data?.results ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const categories = data?.categories ?? [];
  const setParam = (patch: Record<string, unknown>) =>
    navigate({ search: (p: any) => ({ ...p, ...patch, page: undefined }) });

  const showRecent = useMemo(() => !debounced.trim() && recent.length > 0, [debounced, recent]);

  return (
    <PageShell>
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <h1 className="text-3xl font-bold text-foreground">Search NyayaMate</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Government services, legal topics, schemes, FAQs and glossary — all in one place.
        </p>

        <div className="mt-6 flex items-center gap-2 rounded-2xl border border-border bg-card px-4 py-3 shadow-soft">
          <SearchIcon className="h-5 w-5 text-muted-foreground" />
          <input
            autoFocus
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Search for a service, right, scheme…"
            className="flex-1 bg-transparent text-base text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          {input && (
            <button onClick={() => setInput("")} aria-label="Clear">
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            onClick={() => setParam({ type: undefined })}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
              !type ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground hover:text-foreground",
            )}
          >
            All
          </button>
          {TYPE_KEYS.map((k) => {
            const M = TYPE_META[k];
            return (
              <button
                key={k}
                onClick={() => setParam({ type: type === k ? undefined : k })}
                className={cn(
                  "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
                  type === k ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground hover:text-foreground",
                )}
              >
                <M.icon className="h-3.5 w-3.5" /> {M.label}
              </button>
            );
          })}
          <div className="ml-auto flex items-center gap-2">
            {categories.length > 0 && (
              <select
                value={category}
                onChange={(e) => setParam({ category: e.target.value || undefined })}
                className="rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs text-foreground"
              >
                <option value="">All categories</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            )}
            <select
              value={sort}
              onChange={(e) => setParam({ sort: e.target.value })}
              className="rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs text-foreground"
            >
              <option value="relevance">Relevance</option>
              <option value="newest">Newest</option>
              <option value="popularity">Popularity</option>
            </select>
          </div>
        </div>

        {/* Recent searches */}
        {showRecent && (
          <div className="mt-8">
            <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Clock className="h-3.5 w-3.5" /> Recent searches
            </p>
            <div className="flex flex-wrap gap-2">
              {recent.map((r) => (
                <button
                  key={r}
                  onClick={() => setInput(r)}
                  className="rounded-full border border-border bg-card px-3 py-1.5 text-sm text-foreground hover:bg-muted"
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Results */}
        <div className="mt-6">
          {debounced.trim() && (
            <p className="mb-3 text-sm text-muted-foreground">
              {isFetching ? "Searching…" : `${total} result${total === 1 ? "" : "s"} for "${debounced}"`}
            </p>
          )}

          {debounced.trim() && !isFetching && results.length === 0 && (
            <div className="rounded-2xl border border-border bg-card p-10 text-center">
              <SearchIcon className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="mt-3 font-semibold text-foreground">No matches found</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Try different keywords or remove filters.
              </p>
            </div>
          )}

          <div className="space-y-3">
            {results.map((r: SearchResult) => {
              const M = TYPE_META[r.type];
              const Icon = M?.icon ?? SearchIcon;
              return (
                <Link
                  key={`${r.type}-${r.id}`}
                  to={r.link}
                  className="flex gap-4 rounded-2xl border border-border bg-card p-4 shadow-soft transition-shadow hover:shadow-premium"
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                        {r.typeLabel}
                      </span>
                      {r.category && (
                        <span className="text-[11px] text-muted-foreground">{r.category}</span>
                      )}
                      {(r.badges ?? []).map((b) => (
                        <span
                          key={b}
                          className="rounded-full bg-secondary/10 px-2 py-0.5 text-[11px] font-semibold text-secondary"
                        >
                          {b}
                        </span>
                      ))}
                    </div>
                    <p className="mt-1 font-semibold text-foreground">
                      {highlight(r.title, debounced)}
                    </p>
                    {r.snippet && (
                      <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">
                        {highlight(r.snippet, debounced)}
                      </p>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => navigate({ search: (p: any) => ({ ...p, page: page - 1 }) })}
                className="rounded-lg border border-border bg-card px-3 py-1.5 text-sm text-foreground disabled:opacity-40"
              >
                Previous
              </button>
              <span className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => navigate({ search: (p: any) => ({ ...p, page: page + 1 }) })}
                className="rounded-lg border border-border bg-card px-3 py-1.5 text-sm text-foreground disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}
