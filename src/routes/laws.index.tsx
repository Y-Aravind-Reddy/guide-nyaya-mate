import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ArrowRight, Landmark, Search } from "lucide-react";
import { PageShell } from "@/components/layouts/PageShell";
import { Breadcrumbs } from "@/components/nav/Breadcrumbs";
import { lawsQuery } from "@/lib/queries";
import { breadcrumbSchema, jsonLdScript } from "@/lib/structured-data";

export const Route = createFileRoute("/laws/")({
  head: () => ({
    meta: [
      { title: "Law Explorer — Constitution, BNS, BNSS, BSA | NyayaMate AI" },
      {
        name: "description",
        content:
          "Explore India's key laws — the Constitution, Bharatiya Nyaya Sanhita, Bharatiya Nagarik Suraksha Sanhita and Bharatiya Sakshya Adhiniyam — with important sections explained simply.",
      },
      { property: "og:title", content: "Law Explorer — NyayaMate AI" },
      {
        property: "og:description",
        content: "India's key laws and their important sections, in plain language.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    scripts: [
      jsonLdScript(
        breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Law Explorer", path: "/laws" },
        ]),
      ),
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(lawsQuery()),
  component: LawsIndex,
});

function LawsIndex() {
  const { data: laws } = useSuspenseQuery(lawsQuery());
  const [q, setQ] = useState("");
  const term = q.trim().toLowerCase();

  const filtered = useMemo(
    () =>
      !term
        ? laws
        : laws.filter((l) =>
            [l.title, l.short_name, l.description, l.category ?? ""]
              .join(" ")
              .toLowerCase()
              .includes(term),
          ),
    [laws, term],
  );

  return (
    <PageShell>
      <section className="bg-navy py-16 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-wider text-secondary">
            Law Explorer
          </p>
          <h1 className="mt-2 max-w-2xl text-3xl font-extrabold sm:text-4xl">
            The laws behind your rights
          </h1>
          <p className="mt-3 max-w-xl text-white/70">
            Plain-language summaries of India's core laws and the sections citizens encounter most.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <Breadcrumbs
          items={[
            { label: "Home", to: "/" },
            { label: "Legal Knowledge Center", to: "/legal-knowledge" },
            { label: "Law Explorer" },
          ]}
        />

        <div className="relative max-w-md">
          <label htmlFor="laws-search" className="sr-only">
            Search laws
          </label>
          <Search
            className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <input
            id="laws-search"
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search laws…"
            className="w-full rounded-2xl border border-border bg-card py-3 pl-12 pr-4 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          {filtered.map((l) => (
            <Link
              key={l.id}
              to="/laws/$slug"
              params={{ slug: l.slug }}
              className="group rounded-[20px] border border-border bg-card p-6 shadow-card transition-all hover:-translate-y-1 hover:shadow-premium"
            >
              <div className="flex items-center gap-3">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
                  <Landmark className="h-6 w-6" />
                </span>
                <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
                  {l.short_name}
                  {l.enacted_year ? ` · ${l.enacted_year}` : ""}
                </span>
              </div>
              <h2 className="mt-4 text-lg font-bold text-foreground">{l.title}</h2>
              <p className="mt-1.5 line-clamp-3 text-sm text-muted-foreground">{l.description}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary">
                Read summary{" "}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          ))}
          {filtered.length === 0 && (
            <p className="text-sm text-muted-foreground">No laws matched your search.</p>
          )}
        </div>
      </section>
    </PageShell>
  );
}
