import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ArrowRight, Landmark, Search } from "lucide-react";
import { PageShell } from "@/components/layouts/PageShell";
import { schemesQuery } from "@/lib/queries";

export const Route = createFileRoute("/schemes/")({
  head: () => ({
    meta: [
      { title: "Government Schemes — NyayaMate AI" },
      {
        name: "description",
        content:
          "Browse Indian central and state government welfare schemes with eligibility, benefits and how to apply.",
      },
      { property: "og:title", content: "Government Schemes — NyayaMate AI" },
      {
        property: "og:description",
        content: "Explore government welfare schemes — eligibility, benefits, and how to apply.",
      },
      { property: "og:url", content: "https://guide-nyaya-mate.lovable.app/schemes" },
    ],
    links: [{ rel: "canonical", href: "https://guide-nyaya-mate.lovable.app/schemes" }],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(schemesQuery()),
  component: SchemesPage,
});

function SchemesPage() {
  const { data: schemes } = useSuspenseQuery(schemesQuery());
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("All");

  const categories = useMemo(
    () => ["All", ...Array.from(new Set(schemes.map((s) => s.category).filter(Boolean) as string[]))],
    [schemes],
  );

  const filtered = schemes.filter(
    (s) =>
      (cat === "All" || s.category === cat) &&
      (q === "" ||
        s.title.toLowerCase().includes(q.toLowerCase()) ||
        (s.description ?? "").toLowerCase().includes(q.toLowerCase())),
  );

  return (
    <PageShell>
      <section className="bg-navy py-16 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-wider text-secondary">Welfare Schemes</p>
          <h1 className="mt-2 max-w-2xl text-3xl font-extrabold sm:text-4xl">Government Schemes</h1>
          <p className="mt-3 max-w-xl text-white/70">
            Explore central and state welfare schemes — eligibility, benefits, and how to apply.
          </p>
          <div className="mt-6 flex max-w-xl items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-4 py-3 backdrop-blur">
            <Search className="h-5 w-5 text-white/70" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search schemes…"
              className="flex-1 bg-transparent text-sm text-white placeholder:text-white/60 focus:outline-none"
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={
                cat === c
                  ? "rounded-full bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground"
                  : "rounded-full border border-border bg-card px-4 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
              }
            >
              {c}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="mt-10 grid place-items-center rounded-[20px] border border-border bg-card p-12 text-center shadow-card">
            <Landmark className="h-9 w-9 text-muted-foreground" />
            <p className="mt-3 text-sm text-muted-foreground">No schemes match your search.</p>
          </div>
        ) : (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((s) => (
              <Link
                key={s.id}
                to="/schemes/$slug"
                params={{ slug: s.slug }}
                className="group rounded-[20px] border border-border bg-card p-6 shadow-card transition-all hover:-translate-y-1 hover:shadow-premium"
              >
                <span className="inline-flex rounded-full bg-secondary/10 px-2.5 py-0.5 text-[11px] font-semibold text-secondary">
                  {s.category ?? "Scheme"}
                </span>
                <h3 className="mt-3 text-lg font-bold text-foreground">{s.title}</h3>
                <p className="mt-1.5 line-clamp-3 text-sm text-muted-foreground">{s.description}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary">
                  View details <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </PageShell>
  );
}
