/** Helpers for server-rendered schema.org JSON-LD in TanStack route `head()`. */
const SITE = "https://guide-nyaya-mate.lovable.app";

type Crumb = { name: string; path: string };

export function jsonLdScript(schema: Record<string, unknown>) {
  return {
    type: "application/ld+json",
    children: JSON.stringify(schema),
  };
}

export function breadcrumbSchema(crumbs: Crumb[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: `${SITE}${c.path}`,
    })),
  };
}

export function faqPageSchema(faqs: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.slice(0, 50).map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };
}

export function governmentServiceSchema(input: {
  title: string;
  description: string;
  slug: string;
  category?: string | null;
  providerName?: string | null;
  providerUrl?: string | null;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "GovernmentService",
    name: input.title,
    description: input.description,
    url: `${SITE}/government-services/${input.slug}`,
    ...(input.category ? { serviceType: input.category } : {}),
    areaServed: { "@type": "Country", name: "India" },
    provider: {
      "@type": "GovernmentOrganization",
      name: input.providerName ?? "Government of India",
      ...(input.providerUrl ? { url: input.providerUrl } : {}),
    },
  };
}
