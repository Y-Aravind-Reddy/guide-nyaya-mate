import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// ---------- Schemes ----------
export const listSchemes = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("schemes")
      .select("id, title, slug, description, category, jurisdiction")
      .order("title");
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const getScheme = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { slug: string }) => d)
  .handler(async ({ data, context }) => {
    const { data: scheme, error } = await context.supabase
      .from("schemes")
      .select(
        "id, title, slug, description, eligibility, benefits, application_process, category, jurisdiction, source_id",
      )
      .eq("slug", data.slug)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!scheme) return null;
    let source = null;
    if (scheme.source_id) {
      const { data: s } = await context.supabase
        .from("official_sources")
        .select("title, authority, source_url, last_verified_at")
        .eq("id", scheme.source_id)
        .maybeSingle();
      source = s ?? null;
    }
    return { ...scheme, source };
  });

// ---------- Glossary ----------
export const listGlossary = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("glossary")
      .select("id, term, definition, category")
      .order("term");
    if (error) throw new Error(error.message);
    return data ?? [];
  });

// ---------- FAQs ----------
export const listFaqs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("faqs")
      .select("id, category, question, answer, jurisdiction, source_id, created_at")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const upsertFaq = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (d: {
      id?: string;
      category: string;
      question: string;
      answer: string;
      jurisdiction: string;
      source_id: string | null;
    }) => d,
  )
  .handler(async ({ data, context }) => {
    const row = {
      category: data.category || null,
      question: data.question,
      answer: data.answer,
      jurisdiction: data.jurisdiction || "India",
      source_id: data.source_id || null,
    };
    if (data.id) {
      const { error } = await context.supabase.from("faqs").update(row).eq("id", data.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await context.supabase.from("faqs").insert(row);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const deleteFaq = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("faqs").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------- Official Sources ----------
const OFFICIAL_SOURCE_COLS =
  "id, title, authority, source_url, category, jurisdiction, status, last_verified_at, created_at, department, ministry, government_level, state, apply_online_url, forms_url, helpline, email, office_address, source_type, is_active";

export const listOfficialSources = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("official_sources")
      .select(OFFICIAL_SOURCE_COLS)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

type OfficialSourceInput = {
  id?: string;
  title: string;
  authority: string;
  source_url: string;
  category: string;
  jurisdiction: string;
  department?: string;
  ministry?: string;
  government_level?: string;
  state?: string;
  apply_online_url?: string;
  forms_url?: string;
  helpline?: string;
  email?: string;
  office_address?: string;
  source_type?: string;
  is_active?: boolean;
};

export const upsertOfficialSource = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: OfficialSourceInput) => d)
  .handler(async ({ data, context }) => {
    const nz = (v?: string) => (v && v.trim() ? v.trim() : null);
    const row = {
      title: data.title,
      authority: data.authority,
      source_url: data.source_url,
      category: nz(data.category),
      jurisdiction: nz(data.jurisdiction) ?? "India",
      department: nz(data.department),
      ministry: nz(data.ministry),
      government_level: nz(data.government_level),
      state: nz(data.state),
      apply_online_url: nz(data.apply_online_url),
      forms_url: nz(data.forms_url),
      helpline: nz(data.helpline),
      email: nz(data.email),
      office_address: nz(data.office_address),
      source_type: nz(data.source_type),
      is_active: data.is_active ?? true,
    };
    if (data.id) {
      const { error } = await context.supabase
        .from("official_sources")
        .update(row)
        .eq("id", data.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await context.supabase
        .from("official_sources")
        .insert({ ...row, created_by: context.userId, status: "unverified" });
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const verifyOfficialSource = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("official_sources")
      .update({ status: "verified", last_verified_at: new Date().toISOString() })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteOfficialSource = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("official_sources")
      .delete()
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
