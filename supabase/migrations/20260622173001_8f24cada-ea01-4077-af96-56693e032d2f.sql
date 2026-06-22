-- Enable pgvector for embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- =========================================================
-- knowledge_categories
-- =========================================================
CREATE TABLE public.knowledge_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  color TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.knowledge_categories TO authenticated;
GRANT ALL ON public.knowledge_categories TO service_role;

ALTER TABLE public.knowledge_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view categories"
  ON public.knowledge_categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can insert categories"
  ON public.knowledge_categories FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update categories"
  ON public.knowledge_categories FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete categories"
  ON public.knowledge_categories FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- =========================================================
-- knowledge_documents
-- =========================================================
CREATE TABLE public.knowledge_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT,
  description TEXT,
  category TEXT,
  source TEXT NOT NULL DEFAULT 'Manual Upload',
  source_url TEXT,
  language TEXT NOT NULL DEFAULT 'en',
  jurisdiction TEXT,
  state TEXT,
  author TEXT,
  visibility TEXT NOT NULL DEFAULT 'private',
  last_verified_date DATE,
  tags TEXT[] NOT NULL DEFAULT '{}',
  version TEXT NOT NULL DEFAULT '1.0',
  model_version TEXT,
  embedding_model TEXT NOT NULL DEFAULT 'google/gemini-embedding-001',
  status TEXT NOT NULL DEFAULT 'pending',
  file_path TEXT,
  file_type TEXT,
  file_size BIGINT,
  chunk_count INTEGER NOT NULL DEFAULT 0,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  last_processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_knowledge_documents_category ON public.knowledge_documents(category);
CREATE INDEX idx_knowledge_documents_status ON public.knowledge_documents(status);
CREATE INDEX idx_knowledge_documents_created_at ON public.knowledge_documents(created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.knowledge_documents TO authenticated;
GRANT ALL ON public.knowledge_documents TO service_role;

ALTER TABLE public.knowledge_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view documents"
  ON public.knowledge_documents FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert documents"
  ON public.knowledge_documents FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update documents"
  ON public.knowledge_documents FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete documents"
  ON public.knowledge_documents FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- =========================================================
-- rag_chunks
-- =========================================================
CREATE TABLE public.rag_chunks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES public.knowledge_documents(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL DEFAULT 0,
  chunk_title TEXT,
  chunk_text TEXT NOT NULL,
  token_count INTEGER,
  embedding vector,
  embedding_status TEXT NOT NULL DEFAULT 'pending',
  embedding_model TEXT,
  model_version TEXT,
  source_section TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_rag_chunks_document_id ON public.rag_chunks(document_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.rag_chunks TO authenticated;
GRANT ALL ON public.rag_chunks TO service_role;

ALTER TABLE public.rag_chunks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view chunks"
  ON public.rag_chunks FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert chunks"
  ON public.rag_chunks FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update chunks"
  ON public.rag_chunks FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete chunks"
  ON public.rag_chunks FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- =========================================================
-- ingestion_jobs
-- =========================================================
CREATE TABLE public.ingestion_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES public.knowledge_documents(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ingestion_jobs_document_id ON public.ingestion_jobs(document_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ingestion_jobs TO authenticated;
GRANT ALL ON public.ingestion_jobs TO service_role;

ALTER TABLE public.ingestion_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view jobs"
  ON public.ingestion_jobs FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert jobs"
  ON public.ingestion_jobs FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update jobs"
  ON public.ingestion_jobs FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete jobs"
  ON public.ingestion_jobs FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- =========================================================
-- updated_at triggers
-- =========================================================
CREATE TRIGGER update_knowledge_categories_updated_at BEFORE UPDATE ON public.knowledge_categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_knowledge_documents_updated_at BEFORE UPDATE ON public.knowledge_documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_rag_chunks_updated_at BEFORE UPDATE ON public.rag_chunks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_ingestion_jobs_updated_at BEFORE UPDATE ON public.ingestion_jobs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- Seed default categories
-- =========================================================
INSERT INTO public.knowledge_categories (name, description, icon, color) VALUES
  ('Government Services', 'Government service guides and procedures', 'Landmark', '#0B3D91'),
  ('Legal Rights', 'Fundamental and statutory legal rights', 'Scale', '#10B981'),
  ('Government Schemes', 'Welfare and benefit schemes', 'HandCoins', '#F59E0B'),
  ('Certificates', 'Certificate application guides', 'FileBadge', '#0B3D91'),
  ('Property', 'Property and land matters', 'Home', '#10B981'),
  ('Police', 'Police and FIR procedures', 'Shield', '#0B3D91'),
  ('Consumer Rights', 'Consumer protection guidance', 'ShoppingBag', '#F59E0B'),
  ('Employment', 'Labour and employment rights', 'Briefcase', '#10B981'),
  ('Family Law', 'Marriage, divorce, custody', 'Users', '#0B3D91'),
  ('Cyber Crime', 'Cyber crime reporting and safety', 'Bug', '#F59E0B'),
  ('Templates', 'Document and complaint templates', 'FileText', '#10B981'),
  ('Glossary', 'Legal terms and definitions', 'BookA', '#0B3D91'),
  ('FAQ', 'Frequently asked questions', 'HelpCircle', '#F59E0B'),
  ('Official Circulars', 'Government circulars and notices', 'ScrollText', '#0B3D91'),
  ('Court Orders', 'Court judgments and orders', 'Gavel', '#10B981'),
  ('Custom', 'Custom uploaded knowledge', 'Folder', '#64748B');