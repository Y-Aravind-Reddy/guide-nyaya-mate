import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { BookA, Search } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { listGlossary } from "@/lib/content.functions";

export const Route = createFileRoute("/_authenticated/glossary")({
  head: () => ({
    meta: [
      { title: "Legal Glossary — NyayaMate AI" },
      {
        name: "description",
        content: "Plain-language definitions of common Indian legal and government terms.",
      },
    ],
  }),
  component: GlossaryPage,
});

function GlossaryPage() {
  const fetchFn = useServerFn(listGlossary);
  const { data, isLoading } = useQuery({ queryKey: ["glossary"], queryFn: () => fetchFn() });
  const [q, setQ] = useState("");

  const filtered = (data ?? []).filter(
    (g) =>
      g.term.toLowerCase().includes(q.toLowerCase()) ||
      g.definition.toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <DashboardLayout title="Legal Glossary">
      <div>
        <h2 className="text-2xl font-extrabold text-foreground sm:text-3xl">Legal Glossary</h2>
        <p className="mt-1 max-w-xl text-sm text-muted-foreground">
          Common legal and government terms explained in plain language.
        </p>
      </div>

      <div className="mt-6 flex items-center gap-2 rounded-xl border border-border bg-card px-3.5 py-2 sm:max-w-md">
        <Search className="h-4 w-4 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search terms…"
          className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
        />
      </div>

      {isLoading ? (
        <p className="mt-8 text-sm text-muted-foreground">Loading…</p>
      ) : filtered.length === 0 ? (
        <div className="mt-8 grid place-items-center rounded-[20px] border border-border bg-card p-12 text-center shadow-card">
          <BookA className="h-9 w-9 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">No terms found.</p>
        </div>
      ) : (
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {filtered.map((g) => (
            <div key={g.id} className="rounded-[20px] border border-border bg-card p-5 shadow-card">
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
      )}
    </DashboardLayout>
  );
}
