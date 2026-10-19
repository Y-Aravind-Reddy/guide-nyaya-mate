import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ArrowRight, BookOpen, Landmark, Scale, Search, ShieldCheck } from "lucide-react";
import * as Icons from "lucide-react";
import { PublicLayout } from "@/components/layouts/PublicLayout";
import { Breadcrumbs } from "@/components/nav/Breadcrumbs";
import { legalTopicsQuery, lawsQuery } from "@/lib/queries";
import { breadcrumbSchema, jsonLdScript } from "@/lib/structured-data";

export const Route = createFileRoute("/legal-knowledge")({
  head: () => ({
    meta: [
      { title: "Legal Knowledge Center — NyayaMate AI" },
      {
        name: "description",
        content:
          "Explore Indian legal topics, key laws like the Constitution, BNS, BNSS and BSA, and verified official government sources in one place.",
      },
      { property: "og:title", content: "Legal Knowledge Center — NyayaMate AI" },
      {
        property: "og:description",
        content: "Legal topics, laws and verified official sources, explained in plain language.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    scripts: [
      jsonLdScript(
        breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Legal Knowledge Center", path: "/legal-knowledge" },
        ]),
      ),
    ],
  }),
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(legalTopicsQuery()),
      context.queryClient.ensureQueryData(lawsQuery()),
    ]);
  },
  component: LegalKnowledgeCenter,
});

function DynIcon({ name, className }: { name: string; className?: string }) {
  const Cmp = (Icons as unknown as Record<string, typeof Scale>)[name] ?? Scale;
  return <Cmp className={className} />;
}

function LegalKnowledgeCenter() {
  const { data: topics } = useSuspenseQuery(legalTopicsQuery());
  const { data: laws } = useSuspenseQuery(lawsQuery());
  const [q, setQ] = useState("");

  const term = q.trim().toLowerCase();
  const matchedTopics = useMemo(
    () =>
      !term
        ? topics
        : topics.filter((t) =>
            [t.title, t.description, t.category].join(" ").toLowerCase().includes(term),
          ),
    [topics, term],
  );
  const matchedLaws = useMemo(
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
    <PublicLayout>
      <section className="bg-navy py-16 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-wider text-secondary">
            Legal Knowledge Center
          </p>
          <h1 className="mt-2 max-w-3xl text-3xl font-extrabold sm:text-4xl">
            Understand Indian law without the legal jargon
          </h1>
          <p className="mt-3 max-w-2xl text-white/70">
            Browse everyday legal topics, explore the laws behind them, and reach verified official
            government sources — all in one place.
          </p>

          <div className="mt-7 max-w-xl">
            <label htmlFor="lkc-search" className="sr-only">
              Search legal topics and laws
            </label>
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <input
                id="lkc-search"
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search topics or laws — e.g. tenant, FIR, cheating…"
                className="h-13 w-full rounded-2xl border border-white/15 bg-white py-3.5 pl-12 pr-4 text-base text-foreground shadow-card outline-none focus-visible:ring-2 focus-visible:ring-secondary"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: "Legal Knowledge Center" }]} />

        <div className="grid gap-5 sm:grid-cols-3">
          <Link
            to="/legal-rights"
            className="group rounded-[20px] border border-border bg-card p-6 shadow-card transition-all hover:-translate-y-1 hover:shadow-premium"
          >
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-secondary/10 text-secondary">
              <Scale className="h-6 w-6" />
            </span>
            <h2 className="mt-4 text-lg font-bold text-foreground">Legal Topics</h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {topics.length} guides across consumer, cyber, property, tenant, women, employment,
              police and RTI rights.
            </p>
            <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary">
              Browse topics <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </span>
          </Link>

          <Link
            to="/laws"
            className="group rounded-[20px] border border-border bg-card p-6 shadow-card transition-all hover:-translate-y-1 hover:shadow-premium"
          >
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
              <BookOpen className="h-6 w-6" />
            </span>
            <h2 className="mt-4 text-lg font-bold text-foreground">Law Explorer</h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              The Constitution, BNS, BNSS and BSA — with the sections citizens run into most.
            </p>
            <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary">
              Explore laws <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </span>
          </Link>

          <Link
            to="/official-sources"
            className="group rounded-[20px] border border-border bg-card p-6 shadow-card transition-all hover:-translate-y-1 hover:shadow-premium"
          >
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-legal/10 text-legal">
              <ShieldCheck className="h-6 w-6" />
            </span>
            <h2 className="mt-4 text-lg font-bold text-foreground">Official Sources</h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Verified government portals and legal texts behind every guide on this site.
            </p>
            <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary">
              View sources <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </span>
          </Link>
        </div>

        <h2 className="mt-14 text-xl font-bold text-foreground">
          {term ? `Topics matching “${q}”` : "Legal topics"}
        </h2>
        {matchedTopics.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">No topics matched your search.</p>
        ) : (
          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {matchedTopics.map((t) => (
              <Link
                key={t.id}
                to="/legal-rights/$slug"
                params={{ slug: t.slug }}
                className="group rounded-[20px] border border-border bg-card p-5 shadow-card transition-all hover:-translate-y-1 hover:shadow-premium"
              >
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-secondary/10 text-secondary">
                  <DynIcon name={t.icon} className="h-5 w-5" />
                </span>
                <h3 className="mt-3 text-base font-bold text-foreground">{t.title}</h3>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{t.description}</p>
              </Link>
            ))}
          </div>
        )}

        <h2 className="mt-14 text-xl font-bold text-foreground">
          {term ? `Laws matching “${q}”` : "Key laws"}
        </h2>
        {matchedLaws.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">No laws matched your search.</p>
        ) : (
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            {matchedLaws.map((l) => (
              <Link
                key={l.id}
                to="/laws/$slug"
                params={{ slug: l.slug }}
                className="group rounded-[20px] border border-border bg-card p-6 shadow-card transition-all hover:-translate-y-1 hover:shadow-premium"
              >
                <div className="flex items-center gap-3">
                  <span className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/10 text-primary">
                    <Landmark className="h-5 w-5" />
                  </span>
                  <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
                    {l.short_name}
                    {l.enacted_year ? ` · ${l.enacted_year}` : ""}
                  </span>
                </div>
                <h3 className="mt-4 text-lg font-bold text-foreground">{l.title}</h3>
                <p className="mt-1.5 line-clamp-3 text-sm text-muted-foreground">{l.description}</p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </PublicLayout>
  );
}
