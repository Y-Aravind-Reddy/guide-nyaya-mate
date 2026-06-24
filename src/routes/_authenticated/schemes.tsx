import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Search, ArrowRight, Landmark } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { listSchemes } from "@/lib/content.functions";

export const Route = createFileRoute("/_authenticated/schemes")({
  head: () => ({
    meta: [
      { title: "Government Schemes — NyayaMate AI" },
      {
        name: "description",
        content: "Browse Indian government welfare schemes with eligibility, benefits and how to apply.",
      },
    ],
  }),
  component: SchemesPage,
});

function SchemesPage() {
  const fetchFn = useServerFn(listSchemes);
  const { data, isLoading } = useQuery({ queryKey: ["schemes"], queryFn: () => fetchFn() });
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("All");

  const categories = ["All", ...Array.from(new Set((data ?? []).map((s) => s.category).filter(Boolean) as string[]))];
  const filtered = (data ?? []).filter(
    (s) =>
      (cat === "All" || s.category === cat) &&
      (s.title.toLowerCase().includes(q.toLowerCase()) ||
        (s.description ?? "").toLowerCase().includes(q.toLowerCase())),
  );

  return (
    <DashboardLayout title="Government Schemes">
      <div>
        <h2 className="text-2xl font-extrabold text-foreground sm:text-3xl">Government Schemes</h2>
        <p className="mt-1 max-w-xl text-sm text-muted-foreground">
          Explore central and state welfare schemes — eligibility, benefits, and how to apply.
        </p>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex flex-1 items-center gap-2 rounded-xl border border-border bg-card px-3.5 py-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search schemes…"
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                cat === c ? "bg-primary text-primary-foreground" : "border border-border bg-card text-muted-foreground hover:text-foreground"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <p className="mt-8 text-sm text-muted-foreground">Loading schemes…</p>
      ) : filtered.length === 0 ? (
        <div className="mt-8 grid place-items-center rounded-[20px] border border-border bg-card p-12 text-center shadow-card">
          <Landmark className="h-9 w-9 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">No schemes match your search.</p>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((s) => (
            <Link
              key={s.id}
              to="/schemes/$slug"
              params={{ slug: s.slug }}
              className="group rounded-[20px] border border-border bg-card p-5 shadow-card transition-shadow hover:shadow-lg"
            >
              <span className="inline-flex rounded-full bg-secondary/10 px-2.5 py-0.5 text-[11px] font-semibold text-secondary">
                {s.category ?? "Scheme"}
              </span>
              <h3 className="mt-3 text-base font-bold text-foreground">{s.title}</h3>
              <p className="mt-1.5 line-clamp-3 text-sm text-muted-foreground">{s.description}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary">
                View details <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
