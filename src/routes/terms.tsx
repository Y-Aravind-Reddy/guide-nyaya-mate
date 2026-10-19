import { createFileRoute } from "@tanstack/react-router";
import { PublicLayout } from "@/components/layouts/PublicLayout";
import { Breadcrumbs } from "@/components/nav/Breadcrumbs";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms & Conditions — NyayaMate AI" },
      {
        name: "description",
        content:
          "The terms that govern your use of NyayaMate AI, including user responsibilities, intellectual property, service availability and limitation of liability.",
      },
      { property: "og:title", content: "Terms & Conditions — NyayaMate AI" },
      { property: "og:description", content: "Platform usage rules, responsibilities and liability." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TermsPage,
});

const SECTIONS: { title: string; body: string[] }[] = [
  {
    title: "1. Acceptance of terms",
    body: ["By accessing or using NyayaMate AI you agree to these terms. If you do not agree, please do not use the platform."],
  },
  {
    title: "2. Platform usage",
    body: [
      "NyayaMate AI provides informational guidance about legal rights, government services and public schemes in India.",
      "The platform is offered for personal, non-commercial citizen use unless agreed otherwise in writing.",
      "Fair-use limits apply to AI assistance to keep the service available to everyone.",
    ],
  },
  {
    title: "3. User responsibilities",
    body: [
      "Provide accurate information when creating an account and keep your credentials confidential.",
      "Do not submit unlawful, abusive or misleading content, and do not upload other people's personal data without consent.",
      "Do not attempt to disrupt, scrape at scale, reverse engineer or gain unauthorised access to the platform.",
      "Always verify time-sensitive details with the official government source before acting.",
    ],
  },
  {
    title: "4. Intellectual property",
    body: [
      "The NyayaMate AI name, interface, original written guides and software are owned by NyayaMate AI.",
      "Government content referenced on this platform remains the property of the respective authority and is used for public-interest information.",
      "You may share links and short excerpts with attribution.",
    ],
  },
  {
    title: "5. Service availability",
    body: [
      "We aim for continuous availability but the service is provided on an “as available” basis and may be interrupted for maintenance, upgrades or events beyond our control.",
      "Features may be added, changed or withdrawn.",
    ],
  },
  {
    title: "6. Limitation of liability",
    body: [
      "NyayaMate AI is not a law firm and does not provide legal advice or representation.",
      "To the maximum extent permitted by law, we are not liable for indirect or consequential loss arising from reliance on the information provided.",
      "Nothing in these terms limits liability that cannot be excluded under applicable law.",
    ],
  },
  {
    title: "7. Governing law",
    body: ["These terms are governed by the laws of India, with jurisdiction in the courts of the registered office location."],
  },
];

function TermsPage() {
  return (
    <PublicLayout>
      <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
        <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: "Terms & Conditions" }]} />
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">Terms & Conditions</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: {new Date().getFullYear()}</p>
        {SECTIONS.map((s) => (
          <section key={s.title} className="mt-9">
            <h2 className="text-xl font-bold text-foreground">{s.title}</h2>
            <ul className="mt-3 space-y-2 text-sm leading-relaxed text-muted-foreground">
              {s.body.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </PublicLayout>
  );
}
