CREATE POLICY "Admins can read knowledge-base files"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'knowledge-base' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can upload knowledge-base files"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'knowledge-base' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update knowledge-base files"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'knowledge-base' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete knowledge-base files"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'knowledge-base' AND public.has_role(auth.uid(), 'admin'));