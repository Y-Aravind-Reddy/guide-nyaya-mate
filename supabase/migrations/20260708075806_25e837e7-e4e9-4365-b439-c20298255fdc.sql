ALTER TABLE public.official_sources
  ADD COLUMN IF NOT EXISTS link_status text,
  ADD COLUMN IF NOT EXISTS website_link_status text,
  ADD COLUMN IF NOT EXISTS apply_link_status text,
  ADD COLUMN IF NOT EXISTS forms_link_status text,
  ADD COLUMN IF NOT EXISTS website_http_code integer,
  ADD COLUMN IF NOT EXISTS apply_http_code integer,
  ADD COLUMN IF NOT EXISTS forms_http_code integer,
  ADD COLUMN IF NOT EXISTS links_checked_at timestamptz;