import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import * as Icons from "lucide-react";
import { PageShell } from "@/components/layouts/PageShell";
import { legalTopicsQuery } from "@/lib/queries";

export const Route = createFileRoute("/legal-rights/")({
  head: () => ({
    meta: [
      { title: "Legal Rights — NyayaMate AI" },
      {
        name: "description",
        content:
          "Understand your legal rights: consumer rights, cyber crime, property, women's rights, tenant and employment rights, and how to file complaints.",
      },
      { property: "og:title", content: "Legal Rights — NyayaMate AI" },
      { property: "og:description", content: "Know your rights and how to act on them, explained simply." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(legalTopicsQuery()),
  component: LegalRightsPage,
});

function DynIcon({ name, className }: { name: string; className?: string }) {
  const Cmp = (Icons as Record<string, any>)[name] ?? Icons.Scale;
  return <Cmp className={className} />;
}

function LegalRightsPage() {
  const { data: topics } = useSuspenseQuery(legalTopicsQuery());
  const [cat, setCat] = useState("All");
  const categories = ["All", ...Array.from(new Set(topics.map((t) => t.category)))];
  const filtered = topics.filter((t) => cat === "All" || t.category === cat);

  return (
    <PageShell>
      <section className="bg-navy py-16 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-wider text-secondary">Know Your Rights</p>
          <h1 className="mt-2 max-w-2xl text-3xl font-extrabold sm:text-4xl">Legal Rights, Explained Simply</h1>
          <p className="mt-3 max-w-xl text-white/70">
            Clear overviews, procedures, documents and FAQs for the legal situations citizens face most.
          </p>
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
          {filtered.map((t) => (
            <Link
              key={t.id}
              to="/legal-rights/$slug"
              params={{ slug: t.slug }}
              className="group rounded-[20px] border border-border bg-card p-6 shadow-card transition-all hover:-translate-y-1 hover:shadow-premium"
            >
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-secondary/10 text-secondary">
                <DynIcon name={t.icon} className="h-6 w-6" />
              </span>
              <h3 className="mt-4 text-lg font-bold text-foreground">{t.title}</h3>
              <p className="mt-1.5 line-clamp-3 text-sm text-muted-foreground">{t.description}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary">
                Read guide <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          ))}
        </div>
      </section>
    </PageShell>
  );
}
