import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, ExternalLink } from "lucide-react";
import { PageShell } from "@/components/layouts/PageShell";
import { Breadcrumbs } from "@/components/nav/Breadcrumbs";

export const Route = createFileRoute("/disclaimer")({
  head: () => ({
    meta: [
      { title: "Disclaimer — NyayaMate AI" },
      {
        name: "description",
        content:
          "NyayaMate AI provides informational guidance only. It is not legal advice, legal representation or government approval. Always verify with official sources.",
      },
      { property: "og:title", content: "Disclaimer — NyayaMate AI" },
      { property: "og:description", content: "Informational guidance only — not legal advice or government approval." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DisclaimerPage,
});

function DisclaimerPage() {
  return (
    <PageShell>
      <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
        <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: "Disclaimer" }]} />
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">Disclaimer</h1>

        <div
          role="note"
          className="mt-6 flex gap-3 rounded-2xl border border-accent/40 bg-accent/10 p-5"
        >
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-accent" aria-hidden="true" />
          <p className="text-sm font-medium leading-relaxed text-foreground">
            NyayaMate AI provides informational guidance only. It does not constitute legal advice,
            professional legal representation, or government approval.
          </p>
        </div>

        <section className="mt-9">
          <h2 className="text-xl font-bold text-foreground">What this platform is</h2>
          <ul className="mt-3 space-y-2 text-sm leading-relaxed text-muted-foreground">
            <li>A plain-language explainer for legal rights, government services and public schemes.</li>
            <li>A starting point that helps you understand steps, documents and where to apply.</li>
            <li>A directory of verified official government sources and portals.</li>
          </ul>
        </section>

        <section className="mt-9">
          <h2 className="text-xl font-bold text-foreground">What this platform is not</h2>
          <ul className="mt-3 space-y-2 text-sm leading-relaxed text-muted-foreground">
            <li>It is not a law firm and does not create an advocate–client relationship.</li>
            <li>It is not an official government website and is not endorsed by any government body.</li>
            <li>It cannot file applications, grant approvals or guarantee outcomes.</li>
          </ul>
        </section>

        <section className="mt-9">
          <h2 className="text-xl font-bold text-foreground">Accuracy and verification</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Rules, fees and timelines change frequently. AI-generated answers may be incomplete or
            out of date. Always verify details through the official source before acting, and consult
            a qualified advocate for advice on your specific situation.
          </p>
          <Link
            to="/official-sources"
            className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-soft transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <ExternalLink className="h-4 w-4" aria-hidden="true" /> Browse verified official sources
          </Link>
        </section>
      </div>
    </PageShell>
  );
}
