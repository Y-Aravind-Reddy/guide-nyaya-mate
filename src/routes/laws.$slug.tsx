import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ArrowLeft, CalendarClock, ExternalLink, Landmark, Link2 } from "lucide-react";
import { PublicLayout } from "@/components/layouts/PublicLayout";
import { Breadcrumbs } from "@/components/nav/Breadcrumbs";
import { HelpfulFeedback } from "@/components/feedback/HelpfulFeedback";
import { lawDetailQuery } from "@/lib/queries";
import { breadcrumbSchema, jsonLdScript } from "@/lib/structured-data";

export const Route = createFileRoute("/laws/$slug")({
  loader: async ({ context, params }) => {
    const data = await context.queryClient.ensureQueryData(lawDetailQuery(params.slug));
    if (!data) throw notFound();
    return data;
  },
  head: ({ loaderData, params }) => ({
    meta: [
      { title: `${loaderData?.law.title ?? "Law"} — NyayaMate AI` },
      { name: "description", content: loaderData?.law.description ?? "Indian law explained." },
      { property: "og:title", content: `${loaderData?.law.title ?? "Law"} — NyayaMate AI` },
      { property: "og:description", content: loaderData?.law.description ?? "" },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    scripts: [
      jsonLdScript(
        breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Law Explorer", path: "/laws" },
          { name: loaderData?.law.short_name ?? "Law", path: `/laws/${params.slug}` },
        ]),
      ),
    ],
  }),
  component: LawDetail,
  notFoundComponent: () => (
    <PublicLayout>
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <h1 className="text-2xl font-bold">Law not found</h1>
        <Link to="/laws" className="mt-4 inline-block text-primary hover:underline">
          Back to Law Explorer
        </Link>
      </div>
    </PublicLayout>
  ),
});

function LawDetail() {
  const { slug } = Route.useParams();
  const { data } = useSuspenseQuery(lawDetailQuery(slug));
  const { law, sections } = data!;

  return (
    <PublicLayout>
      <section className="bg-navy py-14 text-white">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <Link
            to="/laws"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-white/70 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" /> All Laws
          </Link>
          <div className="mt-4 flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/10 text-secondary">
              <Landmark className="h-5 w-5" />
            </span>
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-secondary">
              {law.short_name}
              {law.enacted_year ? ` · ${law.enacted_year}` : ""}
            </span>
          </div>
          <h1 className="mt-4 text-3xl font-extrabold sm:text-4xl">{law.title}</h1>
          <p className="mt-3 max-w-2xl text-white/70">{law.description}</p>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <Breadcrumbs
          items={[
            { label: "Home", to: "/" },
            { label: "Legal Knowledge Center", to: "/legal-knowledge" },
            { label: "Law Explorer", to: "/laws" },
            { label: law.short_name },
          ]}
        />

        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <CalendarClock className="h-4 w-4" aria-hidden="true" />
          Last updated {new Date(law.last_updated).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>

        {sections.length > 0 && (
          <div className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-card">
            <h2 className="text-xl font-bold text-foreground">Important Sections</h2>
            <ul className="mt-4 space-y-4">
              {sections.map((s) => (
                <li key={s.id} className="rounded-xl border border-border bg-background p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">
                      {s.section_number}
                    </span>
                    <h3 className="text-sm font-bold text-foreground">{s.title}</h3>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{s.summary}</p>
                  {Array.isArray(s.topic_tags) && s.topic_tags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {s.topic_tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full border border-border px-2.5 py-0.5 text-xs text-muted-foreground"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {Array.isArray(law.related_topics) && law.related_topics.length > 0 && (
          <div className="mt-6">
            <h2 className="flex items-center gap-2 text-lg font-bold text-foreground">
              <Link2 className="h-5 w-5 text-primary" /> Related Topics
            </h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {law.related_topics.map((r) => (
                <Link
                  key={r}
                  to="/legal-rights"
                  className="rounded-full border border-border bg-card px-4 py-1.5 text-sm font-medium text-muted-foreground hover:text-primary"
                >
                  {r}
                </Link>
              ))}
            </div>
          </div>
        )}

        {law.official_url && (
          <div className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-card">
            <h2 className="text-lg font-bold text-foreground">Official Source</h2>
            <a
              href={law.official_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
            >
              Read the official text <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        )}

        <HelpfulFeedback contentType="legal_topic" contentSlug={slug} contentTitle={law.title} />
      </section>
    </PublicLayout>
  );
}
