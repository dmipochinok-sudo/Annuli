CREATE OR REPLACE FUNCTION public.specialist_accepts_clients(_specialist uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.specialist_profiles WHERE user_id = _specialist AND is_visible AND accepts_clients)
$$;
REVOKE EXECUTE ON FUNCTION public.specialist_accepts_clients(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.specialist_accepts_clients(uuid) TO authenticated, service_role;