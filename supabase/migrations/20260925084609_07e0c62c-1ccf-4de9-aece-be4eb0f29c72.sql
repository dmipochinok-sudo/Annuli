REVOKE ALL ON FUNCTION public.notify_specialist_inquiry() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.notify_inquiry_message() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.notify_specialist_inquiry() TO service_role;
GRANT EXECUTE ON FUNCTION public.notify_inquiry_message() TO service_role;