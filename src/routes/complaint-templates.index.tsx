import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ArrowRight, FileText, Search } from "lucide-react";
import { PublicLayout } from "@/components/layouts/PublicLayout";
import { Breadcrumbs } from "@/components/nav/Breadcrumbs";
import { complaintTemplatesQuery } from "@/lib/queries";
import { breadcrumbSchema, jsonLdScript } from "@/lib/structured-data";

const CANONICAL = "https://guide-nyaya-mate.lovable.app/complaint-templates";

export const Route = createFileRoute("/complaint-templates/")({
  head: () => ({
    meta: [
      { title: "Complaint Letter Templates — NyayaMate AI" },
      {
        name: "description",
        content:
          "Ready-to-use Indian complaint letter templates — FIR, consumer, cyber crime, RTI, tenancy, workplace and banking. Fill in your details and copy.",
      },
      { property: "og:title", content: "Complaint Letter Templates — NyayaMate AI" },
      {
        property: "og:description",
        content: "Fill-in-the-blank complaint letters for police, consumer, RTI, tenancy and banking matters.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: CANONICAL },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: CANONICAL }],
    scripts: [
      jsonLdScript(
        breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Complaint Templates", path: "/complaint-templates" },
        ]),
      ),
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(complaintTemplatesQuery()),
  component: TemplatesPage,
});

function TemplatesPage() {
  const { data: templates } = useSuspenseQuery(complaintTemplatesQuery());
  const [q, setQ] = useState("");
  const [type, setType] = useState("All");

  const types = ["All", ...Array.from(new Set(templates.map((t) => t.type)))];
  const term = q.trim().toLowerCase();
  const filtered = templates.filter(
    (t) =>
      (type === "All" || t.type === type) &&
      (term === "" ||
        [t.title, t.description ?? "", t.type].join(" ").toLowerCase().includes(term)),
  );

  return (
    <PublicLayout>
      <section className="bg-navy py-16 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-wider text-secondary">
            Complaint Templates
          </p>
          <h1 className="mt-2 max-w-3xl text-3xl font-extrabold sm:text-4xl">
            Write the right complaint, the first time
          </h1>
          <p className="mt-3 max-w-2xl text-white/70">
            Fill in your details and get a properly worded letter you can print, email or submit
            online.
          </p>

          <div className="mt-7 max-w-xl">
            <label htmlFor="tpl-search" className="sr-only">
              Search complaint templates
            </label>
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <input
                id="tpl-search"
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search templates — e.g. refund, FIR, RTI…"
                className="w-full rounded-2xl border border-white/15 bg-white py-3.5 pl-12 pr-4 text-base text-foreground shadow-card outline-none focus-visible:ring-2 focus-visible:ring-secondary"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: "Complaint Templates" }]} />

        <div className="flex flex-wrap gap-2">
          {types.map((c) => (
            <button
              key={c}
              onClick={() => setType(c)}
              className={
                type === c
                  ? "min-h-11 rounded-full bg-primary px-4 py-1.5 text-sm font-semibold capitalize text-primary-foreground"
                  : "min-h-11 rounded-full border border-border bg-card px-4 py-1.5 text-sm font-medium capitalize text-muted-foreground transition-colors hover:text-primary"
              }
            >
              {c}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="mt-10 grid place-items-center rounded-[20px] border border-border bg-card p-12 text-center shadow-card">
            <FileText className="h-9 w-9 text-muted-foreground" aria-hidden="true" />
            <p className="mt-3 text-sm text-muted-foreground">No templates match your search.</p>
          </div>
        ) : (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((t) => (
              <Link
                key={t.id}
                to="/complaint-templates/$id"
                params={{ id: t.id }}
                className="group rounded-[20px] border border-border bg-card p-6 shadow-card transition-all hover:-translate-y-1 hover:shadow-premium"
              >
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-secondary/10 text-secondary">
                  <FileText className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="mt-4 inline-flex rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-semibold capitalize text-muted-foreground">
                  {t.type}
                </span>
                <h2 className="mt-2 text-lg font-bold text-foreground">{t.title}</h2>
                <p className="mt-1.5 line-clamp-3 text-sm text-muted-foreground">{t.description}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary">
                  Use this template{" "}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            ))}
          </div>
        )}

        <p className="mt-10 rounded-2xl border border-border bg-muted/50 p-5 text-sm text-muted-foreground">
          These templates are general drafts for information only and are not legal advice. Review
          the wording, add your own facts, and consult a lawyer for serious matters.
        </p>
      </section>
    </PublicLayout>
  );
}
