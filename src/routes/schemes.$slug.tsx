import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  CheckCircle2,
  Gift,
  ListChecks,
  ShieldCheck,
} from "lucide-react";
import { PageShell } from "@/components/layouts/PageShell";
import { VerifiedBadge } from "@/components/trust/VerifiedBadge";
import { OfficialActions } from "@/components/official/OfficialActions";
import { schemeDetailQuery } from "@/lib/queries";

export const Route = createFileRoute("/schemes/$slug")({
  loader: async ({ context, params }) => {
    const data = await context.queryClient.ensureQueryData(schemeDetailQuery(params.slug));
    if (!data) throw notFound();
    return data;
  },
  head: ({ loaderData, params }) => ({
    meta: [
      { title: `${loaderData?.title ?? "Scheme"} — NyayaMate AI` },
      { name: "description", content: loaderData?.description ?? "Government scheme details." },
      { property: "og:title", content: `${loaderData?.title ?? "Scheme"} — NyayaMate AI` },
      { property: "og:description", content: loaderData?.description ?? "" },
      { property: "og:type", content: "article" },
      { property: "og:url", content: `https://guide-nyaya-mate.lovable.app/schemes/${params.slug}` },
    ],
    links: [
      { rel: "canonical", href: `https://guide-nyaya-mate.lovable.app/schemes/${params.slug}` },
    ],
    scripts: [
      jsonLdScript(
        breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Schemes", path: "/schemes" },
          { name: loaderData?.title ?? "Scheme", path: `/schemes/${params.slug}` },
        ]),
      ),
    ],
  }),
  component: SchemeDetail,
  notFoundComponent: () => (
    <PageShell>
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <h1 className="text-2xl font-bold">Scheme not found</h1>
        <Link to="/schemes" className="mt-4 inline-block text-primary hover:underline">
          Back to schemes
        </Link>
      </div>
    </PageShell>
  ),
});

function SchemeDetail() {
  const { slug } = Route.useParams();
  const { data } = useSuspenseQuery(schemeDetailQuery(slug));
  const scheme = data!;


  const sections = [
    { icon: ShieldCheck, title: "Eligibility", body: scheme.eligibility },
    { icon: Gift, title: "Benefits", body: scheme.benefits },
    { icon: ListChecks, title: "How to Apply", body: scheme.application_process },
  ].filter((s) => s.body);

  return (
    <PageShell>
      <section className="bg-navy py-14 text-white">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <Link
            to="/schemes"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-white/70 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" /> All Schemes
          </Link>
          <span className="mt-4 inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-secondary">
            {scheme.category ?? "Scheme"} · {scheme.jurisdiction}
          </span>
          <h1 className="mt-3 text-3xl font-extrabold sm:text-4xl">{scheme.title}</h1>
          <p className="mt-3 max-w-2xl text-white/70">{scheme.description}</p>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-4">
          {sections.map((s) => (
            <div key={s.title} className="rounded-[20px] border border-border bg-card p-6 shadow-card">
              <h2 className="flex items-center gap-2 text-lg font-bold text-foreground">
                <s.icon className="h-5 w-5 text-primary" /> {s.title}
              </h2>
              <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">{s.body}</p>
            </div>
          ))}
        </div>

        {scheme.source && (
          <div className="mt-5 rounded-[20px] border border-secondary/30 bg-secondary/5 p-6">
            <h2 className="flex flex-wrap items-center gap-2 text-lg font-bold text-foreground">
              <CheckCircle2 className="h-5 w-5 text-secondary" /> Official Source
              <VerifiedBadge date={scheme.source.last_verified_at} />
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {scheme.source.authority}
              {scheme.source.department ? ` · ${scheme.source.department}` : ""}
              {scheme.source.ministry ? ` · ${scheme.source.ministry}` : ""}
              {scheme.source.last_verified_at
                ? ` · Verified ${new Date(scheme.source.last_verified_at).toLocaleDateString("en-IN")}`
                : ""}
            </p>
            <OfficialActions
              portal={scheme.source}
              serviceSlug={scheme.slug}
              serviceTitle={scheme.title}
              variant="compact"
              className="mt-3"
            />
          </div>
        )}
      </section>
    </PageShell>
  );
}
