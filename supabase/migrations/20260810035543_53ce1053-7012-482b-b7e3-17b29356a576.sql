-- 1. Ingestion job state
ALTER TABLE public.ingestion_jobs
  ADD COLUMN IF NOT EXISTS attempts integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_error text;

-- 2. Link verification history
CREATE TABLE IF NOT EXISTS public.link_check_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id uuid REFERENCES public.official_sources(id) ON DELETE CASCADE,
  url text NOT NULL,
  url_kind text NOT NULL DEFAULT 'website',
  status text NOT NULL,
  http_code integer,
  redirect_url text,
  error_message text,
  checked_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.link_check_history TO authenticated;
GRANT ALL ON public.link_check_history TO service_role;
ALTER TABLE public.link_check_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can read link check history" ON public.link_check_history;
CREATE POLICY "Admins can read link check history"
  ON public.link_check_history FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE INDEX IF NOT EXISTS link_check_history_source_idx
  ON public.link_check_history (source_id, checked_at DESC);

-- 3. Least privilege on retrieval function
REVOKE ALL ON FUNCTION public.match_chunks(vector, integer, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.match_chunks(vector, integer, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.match_chunks(vector, integer, text) TO authenticated, service_role;

-- 4. Webhook now authenticates with a dedicated secret
CREATE OR REPLACE FUNCTION public.cms_kb_autosync()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
      'x-kb-sync-secret', 'b6c2504ca92298bf71108d6057887a6b973cf63ffd21f441b54d9e44a8cac2bb'
    ),
    body := jsonb_build_object('type', v_type, 'id', v_id, 'op', v_op)
  );

  IF (TG_OP = 'DELETE') THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$function$;

-- 5. Weekly automated official-link verification
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

DO $$
BEGIN
  PERFORM cron.unschedule('nyayamate-weekly-link-verify');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

SELECT cron.schedule(
  'nyayamate-weekly-link-verify',
  '0 2 * * 0',
  $cron$
  SELECT net.http_post(
    url := 'https://project--13593b1a-b517-4c63-ae54-6cc839042331-dev.lovable.app/api/public/verify-links',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-kb-sync-secret', 'b6c2504ca92298bf71108d6057887a6b973cf63ffd21f441b54d9e44a8cac2bb'
    ),
    body := jsonb_build_object('offset', 0, 'limit', 10, 'continue', true)
  );
  $cron$
);