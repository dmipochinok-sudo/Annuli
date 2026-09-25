REVOKE EXECUTE ON FUNCTION public.notify_project_status() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_access_grant() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_base_access(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.list_specialists() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_base_access(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_specialists() TO authenticated;