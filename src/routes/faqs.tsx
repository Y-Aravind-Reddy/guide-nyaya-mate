import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { HelpCircle, Search } from "lucide-react";
import { PageShell } from "@/components/layouts/PageShell";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { faqsQuery } from "@/lib/queries";
import { breadcrumbSchema, faqPageSchema, jsonLdScript } from "@/lib/structured-data";

export const Route = createFileRoute("/faqs")({
  loader: ({ context }) => context.queryClient.ensureQueryData(faqsQuery()),
  head: ({ loaderData }) => ({
    meta: [
      { title: "FAQs — NyayaMate AI" },
      {
        name: "description",
        content:
          "Frequently asked questions about Indian legal rights, government services and welfare schemes.",
      },
      { property: "og:title", content: "FAQs — NyayaMate AI" },
      {
        property: "og:description",
        content: "Quick answers about legal rights and government services.",
      },
      { property: "og:url", content: "https://guide-nyaya-mate.lovable.app/faqs" },
    ],
    links: [{ rel: "canonical", href: "https://guide-nyaya-mate.lovable.app/faqs" }],
    scripts: [
      jsonLdScript(
        faqPageSchema(
          (loaderData ?? []).map((f: { question: string; answer: string }) => ({
            question: f.question,
            answer: f.answer,
          })),
        ),
      ),
      jsonLdScript(
        breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "FAQs", path: "/faqs" },
        ]),
      ),
    ],
  }),
  component: FaqsPage,
});

function FaqsPage() {
  const { data: faqs } = useSuspenseQuery(faqsQuery());
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("All");

  const categories = useMemo(
    () => ["All", ...Array.from(new Set(faqs.map((f) => f.category).filter(Boolean) as string[]))],
    [faqs],
  );

  const rows = faqs.filter(
    (f) =>
      (cat === "All" || f.category === cat) &&
      (q === "" ||
        f.question.toLowerCase().includes(q.toLowerCase()) ||
        f.answer.toLowerCase().includes(q.toLowerCase())),
  );

  return (
    <PageShell>
      <section className="bg-navy py-16 text-white">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-wider text-secondary">Help Center</p>
          <h1 className="mt-2 text-3xl font-extrabold sm:text-4xl">Frequently Asked Questions</h1>
          <p className="mt-3 max-w-xl text-white/70">
            Quick answers about legal rights, government services and welfare schemes.
          </p>
          <div className="mt-6 flex max-w-xl items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-4 py-3 backdrop-blur">
            <Search className="h-5 w-5 text-white/70" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search FAQs…"
              className="flex-1 bg-transparent text-sm text-white placeholder:text-white/60 focus:outline-none"
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
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

        {rows.length === 0 ? (
          <div className="mt-8 grid place-items-center rounded-[20px] border border-border bg-card p-12 text-center shadow-card">
            <HelpCircle className="h-9 w-9 text-muted-foreground" />
            <p className="mt-3 text-sm text-muted-foreground">No FAQs match your search.</p>
          </div>
        ) : (
          <div className="mt-6 rounded-[20px] border border-border bg-card px-5 shadow-card">
            <Accordion type="single" collapsible>
              {rows.map((f) => (
                <AccordionItem key={f.id} value={f.id}>
                  <AccordionTrigger className="text-left text-sm font-semibold text-foreground">
                    {f.question}
                  </AccordionTrigger>
                  <AccordionContent>
                    <p className="whitespace-pre-line text-sm text-muted-foreground">{f.answer}</p>
                    {f.category && (
                      <span className="mt-2 inline-flex rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                        {f.category}
                      </span>
                    )}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        )}
      </section>
    </PageShell>
  );
}
