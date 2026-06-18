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

      return {
        service: service as GovernmentService,
        steps: (steps ?? []) as Procedure[],
        documents: (docs ?? []) as RequiredDocument[],
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
