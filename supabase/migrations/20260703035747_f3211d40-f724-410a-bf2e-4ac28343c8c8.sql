-- ============================================================
-- Part 1: AI usage tracking (rate limiting + usage dashboard)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.ai_usage_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  guest_key text,
  event_type text NOT NULL DEFAULT 'chat',
  model text,
  prompt_tokens integer NOT NULL DEFAULT 0,
  completion_tokens integer NOT NULL DEFAULT 0,
  total_tokens integer NOT NULL DEFAULT 0,
  response_time_ms integer NOT NULL DEFAULT 0,
  succeeded boolean NOT NULL DEFAULT true,
  rate_limited boolean NOT NULL DEFAULT false,
  cost_estimate numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.ai_usage_events TO authenticated;
GRANT SELECT, INSERT ON public.ai_usage_events TO anon;
GRANT ALL ON public.ai_usage_events TO service_role;

ALTER TABLE public.ai_usage_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users insert their own usage events"
  ON public.ai_usage_events FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users read their own usage events"
  ON public.ai_usage_events FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS ai_usage_events_user_day_idx
  ON public.ai_usage_events (user_id, created_at);
CREATE INDEX IF NOT EXISTS ai_usage_events_created_idx
  ON public.ai_usage_events (created_at);
CREATE INDEX IF NOT EXISTS ai_usage_events_type_idx
  ON public.ai_usage_events (event_type);

-- ============================================================
-- Part 3: Automatic CMS -> Knowledge Base sync via triggers
-- Uses pg_net to asynchronously call the public sync hook so the
-- CMS write transaction is never blocked.
-- ============================================================
CREATE EXTENSION IF NOT EXISTS pg_net;

CREATE OR REPLACE FUNCTION public.cms_kb_autosync()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_type text := TG_ARGV[0];
  v_id uuid;
  v_op text := lower(TG_OP);
  v_url text := 'https://project--13593b1a-b517-4c63-ae54-6cc839042331-dev.lovable.app/api/public/kb-sync';
BEGIN
  IF (TG_OP = 'DELETE') THEN
    v_id := OLD.id;
  ELSE
    v_id := NEW.id;
  END IF;

  PERFORM net.http_post(
    url := v_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'apikey', 'sb_publishable_cZ3AjtFmHEmtqXhx2fB3Xw_q7XXCY2V'
    ),
    body := jsonb_build_object('type', v_type, 'id', v_id, 'op', v_op)
  );

  IF (TG_OP = 'DELETE') THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_kb_autosync ON public.government_services;
CREATE TRIGGER trg_kb_autosync
  AFTER INSERT OR UPDATE OR DELETE ON public.government_services
  FOR EACH ROW EXECUTE FUNCTION public.cms_kb_autosync('government_services');

DROP TRIGGER IF EXISTS trg_kb_autosync ON public.legal_topics;
CREATE TRIGGER trg_kb_autosync
  AFTER INSERT OR UPDATE OR DELETE ON public.legal_topics
  FOR EACH ROW EXECUTE FUNCTION public.cms_kb_autosync('legal_topics');

DROP TRIGGER IF EXISTS trg_kb_autosync ON public.schemes;
CREATE TRIGGER trg_kb_autosync
  AFTER INSERT OR UPDATE OR DELETE ON public.schemes
  FOR EACH ROW EXECUTE FUNCTION public.cms_kb_autosync('schemes');

DROP TRIGGER IF EXISTS trg_kb_autosync ON public.faqs;
CREATE TRIGGER trg_kb_autosync
  AFTER INSERT OR UPDATE OR DELETE ON public.faqs
  FOR EACH ROW EXECUTE FUNCTION public.cms_kb_autosync('faqs');

DROP TRIGGER IF EXISTS trg_kb_autosync ON public.complaint_templates;
CREATE TRIGGER trg_kb_autosync
  AFTER INSERT OR UPDATE OR DELETE ON public.complaint_templates
  FOR EACH ROW EXECUTE FUNCTION public.cms_kb_autosync('complaint_templates');

DROP TRIGGER IF EXISTS trg_kb_autosync ON public.glossary;
CREATE TRIGGER trg_kb_autosync
  AFTER INSERT OR UPDATE OR DELETE ON public.glossary
  FOR EACH ROW EXECUTE FUNCTION public.cms_kb_autosync('glossary');