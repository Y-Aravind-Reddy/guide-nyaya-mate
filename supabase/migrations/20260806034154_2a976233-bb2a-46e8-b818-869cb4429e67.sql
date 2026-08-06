ALTER TABLE public.rag_chunks
  ALTER COLUMN embedding TYPE vector(3072) USING embedding::vector(3072);

CREATE INDEX IF NOT EXISTS rag_chunks_embedding_hnsw
  ON public.rag_chunks USING hnsw ((embedding::halfvec(3072)) halfvec_cosine_ops);

CREATE INDEX IF NOT EXISTS rag_chunks_document_id_idx ON public.rag_chunks (document_id);
CREATE INDEX IF NOT EXISTS rag_chunks_status_idx ON public.rag_chunks (chunk_status);

CREATE OR REPLACE FUNCTION public.match_chunks(query_embedding vector, match_count integer DEFAULT 6, filter_state text DEFAULT NULL::text)
 RETURNS TABLE(chunk_id uuid, document_id uuid, chunk_text text, source_section text, similarity double precision, rank_score double precision, doc_title text, source text, source_url text, content_trust_level text, last_verified_date date, state text, confidence_score numeric)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT
    c.id AS chunk_id,
    c.document_id,
    c.chunk_text,
    c.source_section,
    1 - ((c.embedding::halfvec(3072)) <=> (query_embedding::halfvec(3072))) AS similarity,
    (
      (1 - ((c.embedding::halfvec(3072)) <=> (query_embedding::halfvec(3072))))
      + CASE d.content_trust_level
          WHEN 'official' THEN 0.25
          WHEN 'verified' THEN 0.18
          WHEN 'reviewed' THEN 0.10
          WHEN 'draft' THEN 0.0
          WHEN 'community' THEN -0.05
          ELSE 0.0
        END
      + CASE WHEN filter_state IS NOT NULL AND d.state = filter_state THEN 0.20 ELSE 0.0 END
      + COALESCE(c.confidence_score, 0) * 0.05
      + GREATEST(0, 0.05 - (EXTRACT(EPOCH FROM (now() - d.updated_at)) / 31536000.0) * 0.05)
    ) AS rank_score,
    d.title AS doc_title,
    d.source,
    d.source_url,
    d.content_trust_level::text,
    d.last_verified_date,
    d.state,
    c.confidence_score
  FROM public.rag_chunks c
  JOIN public.knowledge_documents d ON d.id = c.document_id
  WHERE c.embedding IS NOT NULL
    AND c.chunk_status = 'active'
    AND d.is_latest = true
  ORDER BY rank_score DESC
  LIMIT match_count
$function$;