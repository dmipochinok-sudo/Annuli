CREATE OR REPLACE FUNCTION public.guard_specialist_inquiry_update()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.id := OLD.id;
  NEW.client_id := OLD.client_id;
  NEW.specialist_id := OLD.specialist_id;
  NEW.subject := OLD.subject;
  NEW.rate_name := OLD.rate_name;
  NEW.body := OLD.body;
  NEW.created_at := OLD.created_at;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.guard_specialist_inquiry_update() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.guard_specialist_inquiry_update() TO service_role;
CREATE TRIGGER specialist_inquiries_guard_update
BEFORE UPDATE ON public.specialist_inquiries
FOR EACH ROW EXECUTE FUNCTION public.guard_specialist_inquiry_update();

CREATE OR REPLACE FUNCTION public.guard_inquiry_message_update()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.id := OLD.id;
  NEW.inquiry_id := OLD.inquiry_id;
  NEW.sender_id := OLD.sender_id;
  NEW.body := OLD.body;
  NEW.created_at := OLD.created_at;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.guard_inquiry_message_update() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.guard_inquiry_message_update() TO service_role;
CREATE TRIGGER inquiry_messages_guard_update
BEFORE UPDATE ON public.inquiry_messages
FOR EACH ROW EXECUTE FUNCTION public.guard_inquiry_message_update();