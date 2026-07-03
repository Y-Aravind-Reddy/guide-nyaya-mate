import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

function publicClient() {
  return createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
  );
}

export type SearchResult = {
  id: string;
  type: string;
  typeLabel: string;
  title: string;
  snippet: string;
  category: string | null;
  updatedAt: string | null;
  link: string;
};

const TYPE_LABELS: Record<string, string> = {
  government_services: "Government Service",
  legal_topics: "Legal Topic",
  schemes: "Scheme",
  faqs: "FAQ",
  glossary: "Glossary",
};

function snippet(text: string | null | undefined, max = 180): string {
  if (!text) return "";
  const clean = String(text).replace(/\s+/g, " ").trim();
  return clean.length > max ? clean.slice(0, max) + "…" : clean;
}

async function searchType(
  sb: ReturnType<typeof publicClient>,
  type: string,
  q: string,
): Promise<SearchResult[]> {
  const like = `%${q}%`;
  if (type === "government_services") {
    const { data } = await sb
      .from("government_services")
      .select("id, title, slug, description, category, created_at")
      .or(`title.ilike.${like},description.ilike.${like},category.ilike.${like}`)
      .limit(50);
    return (data ?? []).map((r: any) => ({
      id: r.id, type, typeLabel: TYPE_LABELS[type], title: r.title,
      snippet: snippet(r.description), category: r.category,
      updatedAt: r.created_at, link: `/government-services/${r.slug}`,
    }));
  }
  if (type === "legal_topics") {
    const { data } = await sb
      .from("legal_topics")
      .select("id, title, slug, description, category, created_at")
      .or(`title.ilike.${like},description.ilike.${like},category.ilike.${like}`)
      .limit(50);
    return (data ?? []).map((r: any) => ({
      id: r.id, type, typeLabel: TYPE_LABELS[type], title: r.title,
      snippet: snippet(r.description), category: r.category,
      updatedAt: r.created_at, link: `/legal-rights/${r.slug}`,
    }));
  }
  if (type === "schemes") {
    const { data } = await sb
      .from("schemes")
      .select("id, title, slug, description, category, updated_at")
      .or(`title.ilike.${like},description.ilike.${like},category.ilike.${like}`)
      .limit(50);
    return (data ?? []).map((r: any) => ({
      id: r.id, type, typeLabel: TYPE_LABELS[type], title: r.title,
      snippet: snippet(r.description), category: r.category,
      updatedAt: r.updated_at, link: `/schemes/${r.slug}`,
    }));
  }
  if (type === "faqs") {
    const { data } = await sb
      .from("faqs")
      .select("id, question, answer, category, updated_at")
      .or(`question.ilike.${like},answer.ilike.${like},category.ilike.${like}`)
      .limit(50);
    return (data ?? []).map((r: any) => ({
      id: r.id, type, typeLabel: TYPE_LABELS[type], title: r.question,
      snippet: snippet(r.answer), category: r.category,
      updatedAt: r.updated_at, link: `/faqs`,
    }));
  }
  if (type === "glossary") {
    const { data } = await sb
      .from("glossary")
      .select("id, term, definition, category, updated_at")
      .or(`term.ilike.${like},definition.ilike.${like},category.ilike.${like}`)
      .limit(50);
    return (data ?? []).map((r: any) => ({
      id: r.id, type, typeLabel: TYPE_LABELS[type], title: r.term,
      snippet: snippet(r.definition), category: r.category,
      updatedAt: r.updated_at, link: `/glossary`,
    }));
  }
  return [];
}

const ALL_TYPES = ["government_services", "legal_topics", "schemes", "faqs", "glossary"];

// ---------------------------------------------------------------- global search
export const globalSearch = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) =>
    z
      .object({
        q: z.string().max(200).default(""),
        types: z.array(z.string()).optional(),
        category: z.string().optional(),
        sort: z.enum(["relevance", "newest", "popularity"]).default("relevance"),
        page: z.number().int().min(1).default(1),
        pageSize: z.number().int().min(1).max(50).default(12),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const q = data.q.trim();
    if (!q) {
      return { results: [] as SearchResult[], total: 0, categories: [] as string[] };
    }
    const sb = publicClient();
    const types = (data.types?.length ? data.types : ALL_TYPES).filter((t) =>
      ALL_TYPES.includes(t),
    );

    const grouped = await Promise.all(types.map((t) => searchType(sb, t, q)));
    let all = grouped.flat();

    const categories = [...new Set(all.map((r) => r.category).filter(Boolean) as string[])].sort();

    if (data.category) all = all.filter((r) => r.category === data.category);

    const lower = q.toLowerCase();
    if (data.sort === "newest") {
      all.sort((a, b) => (b.updatedAt ?? "").localeCompare(a.updatedAt ?? ""));
    } else {
      // relevance / popularity: exact + title matches rank higher
      all.sort((a, b) => relevance(b, lower) - relevance(a, lower));
    }

    const total = all.length;
    const start = (data.page - 1) * data.pageSize;
    const results = all.slice(start, start + data.pageSize);
    return { results, total, categories };
  });

function relevance(r: SearchResult, q: string): number {
  const title = r.title.toLowerCase();
  let score = 0;
  if (title === q) score += 100;
  if (title.startsWith(q)) score += 40;
  if (title.includes(q)) score += 20;
  if ((r.snippet || "").toLowerCase().includes(q)) score += 5;
  return score;
}

// ---------------------------------------------------------------- autocomplete
export const searchSuggest = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => z.object({ q: z.string().max(120) }).parse(d))
  .handler(async ({ data }) => {
    const q = data.q.trim();
    if (q.length < 2) return { suggestions: [] as SearchResult[] };
    const sb = publicClient();
    const grouped = await Promise.all(
      ["government_services", "legal_topics", "schemes", "faqs"].map((t) =>
        searchType(sb, t, q),
      ),
    );
    const lower = q.toLowerCase();
    const suggestions = grouped
      .flat()
      .sort((a, b) => relevance(b, lower) - relevance(a, lower))
      .slice(0, 8);
    return { suggestions };
  });
