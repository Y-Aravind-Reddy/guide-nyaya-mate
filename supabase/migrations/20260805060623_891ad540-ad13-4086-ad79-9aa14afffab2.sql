ALTER TABLE public.official_sources
  ADD COLUMN IF NOT EXISTS update_url text,
  ADD COLUMN IF NOT EXISTS track_status_url text,
  ADD COLUMN IF NOT EXISTS appointment_url text,
  ADD COLUMN IF NOT EXISTS locate_office_url text,
  ADD COLUMN IF NOT EXISTS mobile_app_url text,
  ADD COLUMN IF NOT EXISTS complaint_url text,
  ADD COLUMN IF NOT EXISTS help_centre_url text;

CREATE TABLE IF NOT EXISTS public.official_link_clicks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id uuid REFERENCES public.official_sources(id) ON DELETE SET NULL,
  service_slug text,
  service_title text,
  action text NOT NULL,
  target_url text,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT INSERT ON public.official_link_clicks TO anon;
GRANT SELECT, INSERT ON public.official_link_clicks TO authenticated;
GRANT ALL ON public.official_link_clicks TO service_role;

ALTER TABLE public.official_link_clicks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can log an official link click"
  ON public.official_link_clicks FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can read official link clicks"
  ON public.official_link_clicks FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS idx_official_link_clicks_created_at ON public.official_link_clicks (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_official_link_clicks_action ON public.official_link_clicks (action);