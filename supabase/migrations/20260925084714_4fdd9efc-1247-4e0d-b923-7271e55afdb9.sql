ALTER TABLE public.specialist_inquiries
ADD COLUMN client_name text NOT NULL DEFAULT '',
ADD COLUMN specialist_name text NOT NULL DEFAULT '';

CREATE OR REPLACE FUNCTION public.fill_specialist_inquiry_names()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  SELECT COALESCE(NULLIF(display_name, ''), 'Клиент') INTO NEW.client_name
  FROM public.profiles WHERE id = NEW.client_id;
  SELECT COALESCE(NULLIF(display_name, ''), 'Специалист') INTO NEW.specialist_name
  FROM public.profiles WHERE id = NEW.specialist_id;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.fill_specialist_inquiry_names() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fill_specialist_inquiry_names() TO service_role;
CREATE TRIGGER specialist_inquiries_fill_names
BEFORE INSERT ON public.specialist_inquiries
FOR EACH ROW EXECUTE FUNCTION public.fill_specialist_inquiry_names();

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
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT
    i.id,
    i.client_id,
    i.specialist_id,
    i.client_name,
    i.specialist_name,
    i.subject,
    i.rate_name,
    i.body,
    i.status,
    i.created_at,
    i.updated_at,
    (SELECT count(*) FROM public.inquiry_messages m
      WHERE m.inquiry_id = i.id AND m.sender_id <> auth.uid() AND NOT m.is_read)
  FROM public.specialist_inquiries i
  WHERE auth.uid() IS NOT NULL
  ORDER BY i.updated_at DESC;
$$;