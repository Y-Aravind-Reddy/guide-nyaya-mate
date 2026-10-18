import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ArrowRight, Clock, Search } from "lucide-react";
import * as Icons from "lucide-react";
import { PageShell } from "@/components/layouts/PageShell";
import { servicesQuery } from "@/lib/queries";
import { categoryTint } from "@/lib/category-colors";

export const Route = createFileRoute("/government-services/")({
  head: () => ({
    meta: [
      { title: "Government Services — NyayaMate AI" },
      {
        name: "description",
        content:
          "Browse step-by-step guides for passport, Aadhaar, PAN, driving licence, property registration and more government services.",
      },
      { property: "og:title", content: "Government Services — NyayaMate AI" },
      {
        property: "og:description",
        content: "Step-by-step guidance for India's most-used government services.",
      },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(servicesQuery()),
  component: ServicesPage,
});

function DynIcon({ name, className }: { name: string; className?: string }) {
  const Cmp = (Icons as Record<string, any>)[name] ?? Icons.FileText;
  return <Cmp className={className} />;
}

function ServicesPage() {
  const { data: services } = useSuspenseQuery(servicesQuery());
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("All");

  const categories = useMemo(
    () => ["All", ...Array.from(new Set(services.map((s) => s.category)))],
    [services],
  );

  const filtered = services.filter(
    (s) =>
      (cat === "All" || s.category === cat) &&
      (q === "" ||
        s.title.toLowerCase().includes(q.toLowerCase()) ||
        s.description.toLowerCase().includes(q.toLowerCase())),
  );

  return (
    <PageShell>
      <section className="bg-navy py-16 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-wider text-secondary">Citizen Services</p>
          <h1 className="mt-2 max-w-2xl text-3xl font-extrabold sm:text-4xl">Government Services Made Simple</h1>
          <p className="mt-3 max-w-xl text-white/70">
            Find clear, step-by-step guidance, required documents, fees and timelines for every service.
          </p>
          <div className="mt-6 flex max-w-xl items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-4 py-3 backdrop-blur">
            <Search className="h-5 w-5 text-white/70" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search services…"
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

        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((s) => (
            <Link
              key={s.id}
              to="/government-services/$slug"
              params={{ slug: s.slug }}
              className="group rounded-[20px] border border-border bg-card p-6 shadow-card transition-all hover:-translate-y-1 hover:shadow-premium"
            >
              <div className="flex items-center justify-between">
                <span
                  className="grid h-12 w-12 place-items-center rounded-2xl"
                  style={categoryTint(s.category)}
                >
                  <DynIcon name={s.icon} className="h-6 w-6" />
                </span>
                <span
                  className="rounded-full px-3 py-1 text-xs font-semibold"
                  style={categoryTint(s.category)}
                >
                  {s.category}
                </span>
              </div>
              <h3 className="mt-4 text-lg font-bold text-foreground">{s.title}</h3>
              <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">{s.description}</p>
              <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
                <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" /> {s.processing_time ?? "Varies"}
                </span>
                <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary">
                  Explore <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
              </div>
            </Link>
          ))}
        </div>

        {filtered.length === 0 && (
          <p className="mt-10 text-center text-muted-foreground">No services match your search.</p>
        )}
      </section>
    </PageShell>
  );
}
