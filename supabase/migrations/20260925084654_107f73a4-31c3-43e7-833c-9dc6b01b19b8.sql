CREATE OR REPLACE FUNCTION public.list_my_specialist_inquiries()
RETURNS TABLE(
  id uuid,
  client_id uuid,
  specialist_id uuid,
  client_name text,
  specialist_name text,
  subject text,
  rate_name text,
  body text,
  status text,
  created_at timestamptz,
  updated_at timestamptz,
  unread_count bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    i.id,
    i.client_id,
    i.specialist_id,
    COALESCE(NULLIF(cp.display_name, ''), 'Клиент'),
    COALESCE(NULLIF(sp.display_name, ''), 'Специалист'),
    i.subject,
    i.rate_name,
    i.body,
    i.status,
    i.created_at,
    i.updated_at,
    (SELECT count(*) FROM public.inquiry_messages m
      WHERE m.inquiry_id = i.id AND m.sender_id <> auth.uid() AND NOT m.is_read)
  FROM public.specialist_inquiries i
  LEFT JOIN public.profiles cp ON cp.id = i.client_id
  LEFT JOIN public.profiles sp ON sp.id = i.specialist_id
  WHERE auth.uid() IS NOT NULL
    AND (i.client_id = auth.uid() OR i.specialist_id = auth.uid() OR public.is_admin() OR public.is_owner())
  ORDER BY i.updated_at DESC;
$$;
REVOKE ALL ON FUNCTION public.list_my_specialist_inquiries() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.list_my_specialist_inquiries() TO authenticated, service_role;