-- ============================================================
-- NyayaMate AI — Production-grade RAG upgrade (schema foundation)
-- ============================================================

-- ---------- ENUMS ----------
DO $$ BEGIN
  CREATE TYPE public.knowledge_source_type AS ENUM (
    'official_government','government_portal','legal_authority','court','verified_source','internal_content'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.content_trust_level AS ENUM (
    'official','verified','reviewed','draft','community','imported'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.doc_review_status AS ENUM (
    'up_to_date','needs_review','expired','archived'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.chunk_type AS ENUM (
    'procedure','faq','document','legal_topic','scheme','glossary','template'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------- UPGRADE knowledge_documents ----------
ALTER TABLE public.knowledge_documents
  ADD COLUMN IF NOT EXISTS previous_document_id uuid REFERENCES public.knowledge_documents(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS is_latest boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS change_log text,
  ADD COLUMN IF NOT EXISTS published_at timestamptz,
  ADD COLUMN IF NOT EXISTS country text DEFAULT 'India',
  ADD COLUMN IF NOT EXISTS district text,
  ADD COLUMN IF NOT EXISTS jurisdiction_type text,
  ADD COLUMN IF NOT EXISTS content_trust_level public.content_trust_level NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS review_frequency text,
  ADD COLUMN IF NOT EXISTS next_review_date date,
  ADD COLUMN IF NOT EXISTS reviewed_by uuid,
  ADD COLUMN IF NOT EXISTS review_status public.doc_review_status NOT NULL DEFAULT 'up_to_date',
  ADD COLUMN IF NOT EXISTS file_hash text,
  ADD COLUMN IF NOT EXISTS sha256 text;

-- ---------- UPGRADE rag_chunks ----------
ALTER TABLE public.rag_chunks
  ADD COLUMN IF NOT EXISTS quality_score numeric,
  ADD COLUMN IF NOT EXISTS confidence_score numeric,
  ADD COLUMN IF NOT EXISTS chunk_type public.chunk_type,
  ADD COLUMN IF NOT EXISTS chunk_status text NOT NULL DEFAULT 'active';

-- ---------- UPGRADE ai_feedback (additive) ----------
ALTER TABLE public.ai_feedback
  ADD COLUMN IF NOT EXISTS query text,
  ADD COLUMN IF NOT EXISTS response text,
  ADD COLUMN IF NOT EXISTS feedback_comment text;

-- ============================================================
-- NEW TABLE: knowledge_sources
-- ============================================================
CREATE TABLE IF NOT EXISTS public.knowledge_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid REFERENCES public.knowledge_documents(id) ON DELETE CASCADE,
  source_title text NOT NULL,
  source_url text,
  official_authority text,
  source_type public.knowledge_source_type NOT NULL DEFAULT 'verified_source',
  citation_text text,
  last_verified_at timestamptz,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.knowledge_sources TO authenticated;
GRANT ALL ON public.knowledge_sources TO service_role;
ALTER TABLE public.knowledge_sources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage knowledge_sources" ON public.knowledge_sources
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

-- ============================================================
-- NEW TABLE: document_versions (version history snapshots)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.document_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES public.knowledge_documents(id) ON DELETE CASCADE,
  version text NOT NULL,
  title text,
  description text,
  change_log text,
  snapshot jsonb,
  created_by uuid,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.document_versions TO authenticated;
GRANT ALL ON public.document_versions TO service_role;
ALTER TABLE public.document_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage document_versions" ON public.document_versions
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

-- ============================================================
-- NEW TABLE: review_tasks
-- ============================================================
CREATE TABLE IF NOT EXISTS public.review_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES public.knowledge_documents(id) ON DELETE CASCADE,
  status public.doc_review_status NOT NULL DEFAULT 'needs_review',
  due_date date,
  assigned_to uuid,
  reviewed_by uuid,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.review_tasks TO authenticated;
GRANT ALL ON public.review_tasks TO service_role;
ALTER TABLE public.review_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage review_tasks" ON public.review_tasks
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

-- ============================================================
-- NEW TABLE: retrieval_logs
-- ============================================================
CREATE TABLE IF NOT EXISTS public.retrieval_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  query text NOT NULL,
  retrieved_chunk_ids uuid[],
  retrieval_time_ms integer,
  response_time_ms integer,
  model_used text,
  confidence_score numeric,
  succeeded boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.retrieval_logs TO authenticated;
GRANT ALL ON public.retrieval_logs TO service_role;
ALTER TABLE public.retrieval_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read retrieval_logs" ON public.retrieval_logs
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Users insert own retrieval_logs" ON public.retrieval_logs
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- ============================================================
-- NEW TABLE: knowledge_health_metrics (snapshots)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.knowledge_health_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_key text NOT NULL,
  metric_value numeric,
  details jsonb,
  captured_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.knowledge_health_metrics TO authenticated;
GRANT ALL ON public.knowledge_health_metrics TO service_role;
ALTER TABLE public.knowledge_health_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage health_metrics" ON public.knowledge_health_metrics
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

-- ---------- updated_at triggers ----------
CREATE TRIGGER trg_knowledge_sources_updated BEFORE UPDATE ON public.knowledge_sources
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_review_tasks_updated BEFORE UPDATE ON public.review_tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------- helpful indexes ----------
CREATE INDEX IF NOT EXISTS idx_kdocs_state ON public.knowledge_documents(state);
CREATE INDEX IF NOT EXISTS idx_kdocs_trust ON public.knowledge_documents(content_trust_level);
CREATE INDEX IF NOT EXISTS idx_kdocs_review_status ON public.knowledge_documents(review_status);
CREATE INDEX IF NOT EXISTS idx_kdocs_hash ON public.knowledge_documents(file_hash);
CREATE INDEX IF NOT EXISTS idx_ksources_doc ON public.knowledge_sources(document_id);
CREATE INDEX IF NOT EXISTS idx_docversions_doc ON public.document_versions(document_id);
CREATE INDEX IF NOT EXISTS idx_review_tasks_doc ON public.review_tasks(document_id);