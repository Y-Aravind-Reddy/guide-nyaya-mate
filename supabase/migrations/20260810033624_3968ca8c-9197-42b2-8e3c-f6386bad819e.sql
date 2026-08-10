DROP POLICY IF EXISTS "Official sources are readable by everyone" ON public.official_sources;

CREATE POLICY "Authenticated can read active verified official sources"
ON public.official_sources FOR SELECT TO authenticated
USING ((is_active = true AND status = 'verified') OR public.has_role(auth.uid(), 'admin'));