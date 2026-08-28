CREATE POLICY "Users read own media"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'annuli-media' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users insert own media"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'annuli-media' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users update own media"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'annuli-media' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'annuli-media' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users delete own media"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'annuli-media' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Admins read all media"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'annuli-media' AND private.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins insert all media"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'annuli-media' AND private.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins update all media"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'annuli-media' AND private.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (bucket_id = 'annuli-media' AND private.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins delete all media"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'annuli-media' AND private.has_role(auth.uid(), 'admin'::app_role));