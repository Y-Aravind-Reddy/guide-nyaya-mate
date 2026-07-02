import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { BookA, Search } from "lucide-react";
import { PageShell } from "@/components/layouts/PageShell";
import { glossaryQuery } from "@/lib/queries";

export const Route = createFileRoute("/glossary")({
  head: () => ({
    meta: [
      { title: "Legal Glossary — NyayaMate AI" },
      {
        name: "description",
        content: "Plain-language definitions of common Indian legal and government terms.",
      },
      { property: "og:title", content: "Legal Glossary — NyayaMate AI" },
      {
        property: "og:description",
        content: "Common legal and government terms explained in plain language.",
      },
      { property: "og:url", content: "https://guide-nyaya-mate.lovable.app/glossary" },
    ],
    links: [{ rel: "canonical", href: "https://guide-nyaya-mate.lovable.app/glossary" }],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(glossaryQuery()),
  component: GlossaryPage,
});

function GlossaryPage() {
  const { data: terms } = useSuspenseQuery(glossaryQuery());
  const [q, setQ] = useState("");

  const filtered = terms.filter(
    (g) =>
      q === "" ||
      g.term.toLowerCase().includes(q.toLowerCase()) ||
      g.definition.toLowerCase().includes(q.toLowerCase()),
  );

  const grouped = useMemo(() => {
    const map = new Map<string, typeof filtered>();
    for (const g of filtered) {
      const letter = (g.term[0] ?? "#").toUpperCase();
      const key = /[A-Z]/.test(letter) ? letter : "#";
      map.set(key, [...(map.get(key) ?? []), g]);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [filtered]);

  return (
    <PageShell>
      <section className="bg-navy py-16 text-white">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-wider text-secondary">Glossary</p>
          <h1 className="mt-2 text-3xl font-extrabold sm:text-4xl">Legal Glossary</h1>
          <p className="mt-3 max-w-xl text-white/70">
            Common legal and government terms explained in plain language.
          </p>
          <div className="mt-6 flex max-w-xl items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-4 py-3 backdrop-blur">
            <Search className="h-5 w-5 text-white/70" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search terms…"
              className="flex-1 bg-transparent text-sm text-white placeholder:text-white/60 focus:outline-none"
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        {grouped.length === 0 ? (
          <div className="grid place-items-center rounded-[20px] border border-border bg-card p-12 text-center shadow-card">
            <BookA className="h-9 w-9 text-muted-foreground" />
            <p className="mt-3 text-sm text-muted-foreground">No terms found.</p>
          </div>
        ) : (
          <div className="space-y-10">
            {grouped.map(([letter, items]) => (
              <div key={letter}>
                <h2 className="text-lg font-extrabold text-primary">{letter}</h2>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {items.map((g) => (
                    <div
                      key={g.id}
                      className="rounded-[20px] border border-border bg-card p-5 shadow-card"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-base font-bold text-foreground">{g.term}</h3>
                        {g.category && (
                          <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                            {g.category}
                          </span>
                        )}
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">{g.definition}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </PageShell>
  );
}
