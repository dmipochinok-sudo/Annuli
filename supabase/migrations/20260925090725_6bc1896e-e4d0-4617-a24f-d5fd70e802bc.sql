DROP POLICY IF EXISTS "site_assets_public_read" ON storage.objects;

DROP POLICY IF EXISTS "Public can read site addons" ON public.site_addons;
CREATE POLICY "Public can read visible site addons" ON public.site_addons
  FOR SELECT TO anon, authenticated USING (is_visible = true);
CREATE POLICY "Admins can read all site addons" ON public.site_addons
  FOR SELECT TO authenticated USING (public.is_admin());