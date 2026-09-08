import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";

const BASE_URL = "https://guide-nyaya-mate.lovable.app";

interface SitemapEntry {
  path: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

async function fetchSlugs(table: string): Promise<string[]> {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return [];
  try {
    const res = await fetch(`${url}/rest/v1/${table}?select=slug`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    });
    if (!res.ok) return [];
    const rows = (await res.json()) as { slug: string }[];
    return rows.map((r) => r.slug).filter(Boolean);
  } catch {
    return [];
  }
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const entries: SitemapEntry[] = [
          { path: "/", changefreq: "weekly", priority: "1.0" },
          { path: "/government-services", changefreq: "weekly", priority: "0.9" },
          { path: "/legal-rights", changefreq: "weekly", priority: "0.9" },
          { path: "/schemes", changefreq: "weekly", priority: "0.9" },
          { path: "/faqs", changefreq: "weekly", priority: "0.8" },
          { path: "/glossary", changefreq: "monthly", priority: "0.7" },
          { path: "/about", changefreq: "monthly", priority: "0.6" },
          { path: "/contact", changefreq: "monthly", priority: "0.6" },
          { path: "/official-sources", changefreq: "weekly", priority: "0.7" },
          { path: "/accessibility", changefreq: "yearly", priority: "0.5" },
          { path: "/privacy-policy", changefreq: "yearly", priority: "0.5" },
          { path: "/terms", changefreq: "yearly", priority: "0.5" },
          { path: "/disclaimer", changefreq: "yearly", priority: "0.5" },
          { path: "/login", changefreq: "monthly", priority: "0.4" },
        ];

        const [services, topics, schemes] = await Promise.all([
          fetchSlugs("government_services"),
          fetchSlugs("legal_topics"),
          fetchSlugs("schemes"),
        ]);

        for (const slug of services)
          entries.push({ path: `/government-services/${slug}`, changefreq: "monthly", priority: "0.8" });
        for (const slug of topics)
          entries.push({ path: `/legal-rights/${slug}`, changefreq: "monthly", priority: "0.8" });
        for (const slug of schemes)
          entries.push({ path: `/schemes/${slug}`, changefreq: "monthly", priority: "0.8" });

        const urls = entries.map((e) =>
          [
            `  <url>`,
            `    <loc>${BASE_URL}${e.path}</loc>`,
            e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
            e.priority ? `    <priority>${e.priority}</priority>` : null,
            `  </url>`,
          ]
            .filter(Boolean)
            .join("\n"),
        );

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...urls,
          `</urlset>`,
        ].join("\n");

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
