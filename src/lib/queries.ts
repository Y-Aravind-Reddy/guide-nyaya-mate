import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type GovernmentService = {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  icon: string;
  eligibility: string | null;
  fees: string | null;
  processing_time: string | null;
};

export type Procedure = {
  id: string;
  step_number: number;
  title: string;
  description: string;
};

export type RequiredDocument = { id: string; document_name: string };

export type LegalTopic = {
  id: string;
  title: string;
  slug: string;
  category: string;
  description: string;
  overview: string | null;
  procedure: string | null;
  documents: string[];
  faq: { q: string; a: string }[];
  related: string[];
  icon: string;
};

export const servicesQuery = () =>
  queryOptions({
    queryKey: ["government_services"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("government_services")
        .select("*")
        .order("title");
      if (error) throw error;
      return data as GovernmentService[];
    },
  });

export const serviceDetailQuery = (slug: string) =>
  queryOptions({
    queryKey: ["government_service", slug],
    queryFn: async () => {
      const { data: service, error } = await supabase
        .from("government_services")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw error;
      if (!service) return null;

      const [{ data: steps }, { data: docs }] = await Promise.all([
        supabase
          .from("procedures")
          .select("id, step_number, title, description")
          .eq("service_id", service.id)
          .order("step_number"),
        supabase
          .from("required_documents")
          .select("id, document_name")
          .eq("service_id", service.id),
      ]);

      let portal: OfficialPortal | null = null;
      if ((service as { source_id?: string | null }).source_id) {
        const { data: p } = await supabase
          .from("official_sources")
          .select(OFFICIAL_PORTAL_COLS)
          .eq("id", (service as { source_id: string }).source_id)
          .maybeSingle();
        portal = (p as unknown as OfficialPortal) ?? null;
      }

      return {
        service: service as GovernmentService,
        steps: (steps ?? []) as Procedure[],
        documents: (docs ?? []) as RequiredDocument[],
        portal,
      };
    },
  });

export const legalTopicsQuery = () =>
  queryOptions({
    queryKey: ["legal_topics"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("legal_topics")
        .select("*")
        .order("title");
      if (error) throw error;
      return data as unknown as LegalTopic[];
    },
  });

export const legalTopicDetailQuery = (slug: string) =>
  queryOptions({
    queryKey: ["legal_topic", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("legal_topics")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as LegalTopic | null;
    },
  });

// ---------- Schemes ----------
export type Scheme = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  category: string | null;
  jurisdiction: string | null;
};

export const schemesQuery = () =>
  queryOptions({
    queryKey: ["public_schemes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("schemes")
        .select("id, title, slug, description, category, jurisdiction")
        .order("title");
      if (error) throw error;
      return (data ?? []) as Scheme[];
    },
  });

export const schemeDetailQuery = (slug: string) =>
  queryOptions({
    queryKey: ["public_scheme", slug],
    queryFn: async () => {
      const { data: scheme, error } = await supabase
        .from("schemes")
        .select(
          "id, title, slug, description, eligibility, benefits, application_process, category, jurisdiction, source_id",
        )
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw error;
      if (!scheme) return null;
      let source = null;
      if (scheme.source_id) {
        const { data: s } = await supabase
          .from("official_sources")
          .select("title, authority, source_url, last_verified_at")
          .eq("id", scheme.source_id)
          .maybeSingle();
        source = s ?? null;
      }
      return { ...scheme, source } as typeof scheme & {
        source: {
          title: string;
          authority: string | null;
          source_url: string;
          last_verified_at: string | null;
        } | null;
      };
    },
  });

// ---------- Glossary ----------
export type GlossaryTerm = {
  id: string;
  term: string;
  definition: string;
  category: string | null;
};

export const glossaryQuery = () =>
  queryOptions({
    queryKey: ["public_glossary"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("glossary")
        .select("id, term, definition, category")
        .order("term");
      if (error) throw error;
      return (data ?? []) as GlossaryTerm[];
    },
  });

// ---------- FAQs ----------
export type Faq = {
  id: string;
  category: string | null;
  question: string;
  answer: string;
  jurisdiction: string | null;
  source_id: string | null;
};

export const faqsQuery = () =>
  queryOptions({
    queryKey: ["public_faqs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("faqs")
        .select("id, category, question, answer, jurisdiction, source_id, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as (Faq & { created_at: string })[];
    },
  });

