import { createFileRoute } from "@tanstack/react-router";
import { PublicLayout } from "@/components/layouts/PublicLayout";
import { Breadcrumbs } from "@/components/nav/Breadcrumbs";

export const Route = createFileRoute("/privacy-policy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — NyayaMate AI" },
      {
        name: "description",
        content:
          "How NyayaMate AI collects, uses, stores and protects your personal data, including cookies, authentication and data retention.",
      },
      { property: "og:title", content: "Privacy Policy — NyayaMate AI" },
      { property: "og:description", content: "Our data handling, cookies, authentication and retention practices." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PrivacyPage,
});

const SECTIONS: { title: string; body: string[] }[] = [
  {
    title: "1. Information we collect",
    body: [
      "Account information you provide when registering: name, email address and optional phone number.",
      "Usage information such as the questions you ask the AI assistant, saved guides and pages you view.",
      "Technical information such as browser type, device type and approximate region, used for security and performance.",
    ],
  },
  {
    title: "2. How we use your information",
    body: [
      "To create and secure your account and keep you signed in.",
      "To generate guidance responses and show your saved items and history.",
      "To improve accuracy, detect abuse, apply fair-use limits and measure content quality.",
      "We do not sell your personal data and we do not use it for advertising.",
    ],
  },
  {
    title: "3. Cookies and local storage",
    body: [
      "We use strictly necessary cookies and browser storage to keep your session active and remember your language preference.",
      "We do not use third-party advertising or cross-site tracking cookies.",
    ],
  },
  {
    title: "4. Authentication and security",
    body: [
      "Authentication is handled by our managed identity provider. Passwords are stored only as salted hashes and are never visible to us.",
      "Data is encrypted in transit using TLS and access to production data is restricted to authorised administrators.",
      "Every record is protected by row-level access rules so that you can only read your own data.",
    ],
  },
  {
    title: "5. Data retention",
    body: [
      "Account data is retained while your account is active.",
      "Conversation history is retained for up to 24 months, after which it is deleted or anonymised.",
      "Audit and security logs are retained for up to 12 months.",
      "You may request deletion of your account and associated data at any time.",
    ],
  },
  {
    title: "6. Your rights",
    body: [
      "You may access, correct, export or delete your personal data.",
      "You may withdraw consent for optional processing without affecting the lawfulness of prior processing.",
      "Requests are handled within 30 days.",
    ],
  },
  {
    title: "7. Contact",
    body: [
      "Grievance officer: privacy@nyayamate.ai",
      "Please replace this address with your official grievance contact before launch.",
    ],
  },
];

function PrivacyPage() {
  return (
    <PublicLayout>
      <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
        <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: "Privacy Policy" }]} />
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">Privacy Policy</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: {new Date().getFullYear()}</p>
        <p className="mt-4 leading-relaxed text-muted-foreground">
          This policy explains what information NyayaMate AI collects, why we collect it, and the
          choices you have. It applies to this website and all of its services.
        </p>

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
