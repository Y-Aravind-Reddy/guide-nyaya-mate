-- PART 1: Enrich official_sources with trust/contact metadata
ALTER TABLE public.official_sources
  ADD COLUMN IF NOT EXISTS department text,
  ADD COLUMN IF NOT EXISTS ministry text,
  ADD COLUMN IF NOT EXISTS government_level text,
  ADD COLUMN IF NOT EXISTS state text,
  ADD COLUMN IF NOT EXISTS apply_online_url text,
  ADD COLUMN IF NOT EXISTS forms_url text,
  ADD COLUMN IF NOT EXISTS helpline text,
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS office_address text,
  ADD COLUMN IF NOT EXISTS source_type text,
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

-- Link Official Sources to CMS entities that don't yet reference them
ALTER TABLE public.government_services
  ADD COLUMN IF NOT EXISTS source_id uuid REFERENCES public.official_sources(id) ON DELETE SET NULL;
ALTER TABLE public.legal_topics
  ADD COLUMN IF NOT EXISTS source_id uuid REFERENCES public.official_sources(id) ON DELETE SET NULL;
ALTER TABLE public.glossary
  ADD COLUMN IF NOT EXISTS source_id uuid REFERENCES public.official_sources(id) ON DELETE SET NULL;

-- Allow the public website to read verified/active official sources for trust badges & citations
DROP POLICY IF EXISTS "Public can read active verified official sources" ON public.official_sources;
CREATE POLICY "Public can read active verified official sources"
  ON public.official_sources FOR SELECT
  TO anon
  USING (is_active = true AND status = 'verified');

GRANT SELECT ON public.official_sources TO anon;