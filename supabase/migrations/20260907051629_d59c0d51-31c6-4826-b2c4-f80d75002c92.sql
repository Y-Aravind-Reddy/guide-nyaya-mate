CREATE TABLE public.content_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content_type TEXT NOT NULL,
  content_slug TEXT NOT NULL,
  content_title TEXT,
  helpful BOOLEAN NOT NULL,
  comment TEXT,
  user_id UUID REFERENCES auth.users ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT INSERT ON public.content_feedback TO anon;
GRANT SELECT, INSERT ON public.content_feedback TO authenticated;
GRANT ALL ON public.content_feedback TO service_role;

ALTER TABLE public.content_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit content feedback"
  ON public.content_feedback FOR INSERT TO anon, authenticated
  WITH CHECK (user_id IS NULL OR user_id = auth.uid());

CREATE POLICY "Admins can read content feedback"
  ON public.content_feedback FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_content_feedback_slug ON public.content_feedback (content_type, content_slug, created_at DESC);