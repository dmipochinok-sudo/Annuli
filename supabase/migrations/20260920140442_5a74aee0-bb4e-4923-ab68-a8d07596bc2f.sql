-- RLS на storage.objects для бакета site-assets
-- Чтение: публично (аноним + авторизованные)
DROP POLICY IF EXISTS "site_assets_public_read" ON storage.objects;
CREATE POLICY "site_assets_public_read"
  ON storage.objects
  FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'site-assets');

-- Запись: только администраторы (INSERT/UPDATE/DELETE в одном ALL-правиле)
DROP POLICY IF EXISTS "site_assets_admin_write" ON storage.objects;
CREATE POLICY "site_assets_admin_write"
  ON storage.objects
  FOR ALL
  TO authenticated
  USING (bucket_id = 'site-assets' AND public.is_admin())
  WITH CHECK (bucket_id = 'site-assets' AND public.is_admin());
