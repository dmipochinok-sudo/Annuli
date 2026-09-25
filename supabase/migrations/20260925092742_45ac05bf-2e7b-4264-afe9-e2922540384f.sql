ALTER TABLE public.specialist_profiles
  ADD COLUMN first_name text NOT NULL DEFAULT '',
  ADD COLUMN last_name text NOT NULL DEFAULT '';

DROP FUNCTION public.list_featured_specialists();
CREATE OR REPLACE FUNCTION public.list_featured_specialists()
RETURNS TABLE(user_id uuid, full_name text, first_name text, last_name text, avatar_url text, specialization_ru text, specialization_en text,
  about_ru text, about_en text, regions_ru text, regions_en text, archives_ru text, archives_en text,
  activities_ru text, activities_en text, accepts_clients boolean, featured_order integer, rates jsonb, reviews jsonb)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT s.user_id,
    COALESCE(NULLIF(trim(concat_ws(' ', NULLIF(s.first_name,''), NULLIF(s.last_name,''))), ''), NULLIF(p.display_name,''), 'Специалист'),
    s.first_name, s.last_name, s.avatar_url,
    s.specialization_ru, s.specialization_en, s.about_ru, s.about_en, s.regions_ru, s.regions_en,
    s.archives_ru, s.archives_en, s.activities_ru, s.activities_en, s.accepts_clients, s.featured_order,
    COALESCE((SELECT jsonb_agg(jsonb_build_object('kind',r.kind,'name_ru',r.name_ru,'name_en',r.name_en,'price_ru',r.price_ru,'price_en',r.price_en,'term_ru',r.term_ru,'term_en',r.term_en) ORDER BY r.sort_order, r.created_at) FROM public.specialist_rates r WHERE r.user_id=s.user_id), '[]'::jsonb),
    COALESCE((SELECT jsonb_agg(jsonb_build_object('client_name',v.client_name,'body',v.body,'reply',v.reply,'created_at',v.created_at) ORDER BY v.created_at DESC) FROM public.specialist_reviews v WHERE v.specialist_id=s.user_id AND v.is_published), '[]'::jsonb)
  FROM public.specialist_profiles s
  JOIN public.profiles p ON p.id=s.user_id
  WHERE s.featured AND s.is_visible
  ORDER BY s.featured_order, s.updated_at
  LIMIT 6;
$$;
REVOKE ALL ON FUNCTION public.list_featured_specialists() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_featured_specialists() TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.staff_list_specialists()
RETURNS TABLE(user_id uuid, full_name text, email text, has_card boolean, is_visible boolean,
  accepts_clients boolean, featured boolean, featured_order integer, plan text, bases_limit integer, bases_count bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.id,
    COALESCE(NULLIF(trim(concat_ws(' ', NULLIF(s.first_name,''), NULLIF(s.last_name,''))), ''), NULLIF(p.display_name,''), p.email),
    p.email, s.user_id IS NOT NULL, COALESCE(s.is_visible,false), COALESCE(s.accepts_clients,true),
    COALESCE(s.featured,false), COALESCE(s.featured_order,0), COALESCE(s.plan,'free'), COALESCE(s.bases_limit,10),
    (SELECT count(*) FROM public.genealogy_bases b WHERE b.owner_id=p.id)
  FROM public.profiles p
  JOIN public.user_product_roles upr ON upr.user_id=p.id AND upr.product_role='specialist'
  LEFT JOIN public.specialist_profiles s ON s.user_id=p.id
  WHERE public.is_admin()
  ORDER BY COALESCE(s.featured,false) DESC, COALESCE(s.featured_order,0), p.display_name, p.email;
$$;
REVOKE ALL ON FUNCTION public.staff_list_specialists() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.staff_list_specialists() TO authenticated, service_role;