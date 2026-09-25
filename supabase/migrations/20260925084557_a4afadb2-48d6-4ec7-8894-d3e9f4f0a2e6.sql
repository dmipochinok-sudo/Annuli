CREATE TABLE public.specialist_inquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL,
  specialist_id uuid NOT NULL,
  subject text NOT NULL CHECK (char_length(btrim(subject)) BETWEEN 1 AND 160),
  rate_name text NOT NULL DEFAULT '' CHECK (char_length(rate_name) <= 200),
  body text NOT NULL CHECK (char_length(btrim(body)) BETWEEN 1 AND 5000),
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new','in_progress','closed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT specialist_inquiries_distinct_users CHECK (client_id <> specialist_id)
);
GRANT SELECT, INSERT, UPDATE ON public.specialist_inquiries TO authenticated;
GRANT ALL ON public.specialist_inquiries TO service_role;
ALTER TABLE public.specialist_inquiries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Participants view specialist inquiries"
ON public.specialist_inquiries FOR SELECT TO authenticated
USING (client_id = auth.uid() OR specialist_id = auth.uid() OR public.is_admin() OR public.is_owner());
CREATE POLICY "Clients create specialist inquiries"
ON public.specialist_inquiries FOR INSERT TO authenticated
WITH CHECK (
  client_id = auth.uid()
  AND public.current_app_role() = 'client'
  AND EXISTS (
    SELECT 1 FROM public.specialist_profiles s
    WHERE s.user_id = specialist_id AND s.is_visible AND s.accepts_clients
  )
);
CREATE POLICY "Specialists update addressed inquiries"
ON public.specialist_inquiries FOR UPDATE TO authenticated
USING (specialist_id = auth.uid())
WITH CHECK (specialist_id = auth.uid());
CREATE TRIGGER specialist_inquiries_set_updated_at
BEFORE UPDATE ON public.specialist_inquiries
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.inquiry_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inquiry_id uuid NOT NULL REFERENCES public.specialist_inquiries(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  body text NOT NULL CHECK (char_length(btrim(body)) BETWEEN 1 AND 5000),
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.inquiry_messages TO authenticated;
GRANT ALL ON public.inquiry_messages TO service_role;
ALTER TABLE public.inquiry_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Participants view inquiry messages"
ON public.inquiry_messages FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.specialist_inquiries i
  WHERE i.id = inquiry_id
    AND (i.client_id = auth.uid() OR i.specialist_id = auth.uid() OR public.is_admin() OR public.is_owner())
));
CREATE POLICY "Participants send inquiry messages"
ON public.inquiry_messages FOR INSERT TO authenticated
WITH CHECK (
  sender_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.specialist_inquiries i
    WHERE i.id = inquiry_id
      AND (i.client_id = auth.uid() OR i.specialist_id = auth.uid())
  )
);
CREATE POLICY "Participants mark received messages read"
ON public.inquiry_messages FOR UPDATE TO authenticated
USING (
  sender_id <> auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.specialist_inquiries i
    WHERE i.id = inquiry_id
      AND (i.client_id = auth.uid() OR i.specialist_id = auth.uid())
  )
)
WITH CHECK (
  sender_id <> auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.specialist_inquiries i
    WHERE i.id = inquiry_id
      AND (i.client_id = auth.uid() OR i.specialist_id = auth.uid())
  )
);
CREATE TRIGGER inquiry_messages_set_updated_at
BEFORE UPDATE ON public.inquiry_messages
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.notify_specialist_inquiry()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.notifications (user_id, kind, body)
    VALUES (NEW.specialist_id, 'inquiry', 'Новая заявка от клиента: «' || NEW.subject || '»');
  ELSIF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.notifications (user_id, kind, body)
    VALUES (NEW.client_id, 'inquiry', 'Статус заявки «' || NEW.subject || '» изменён: ' || NEW.status);
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER specialist_inquiries_notify
AFTER INSERT OR UPDATE OF status ON public.specialist_inquiries
FOR EACH ROW EXECUTE FUNCTION public.notify_specialist_inquiry();

CREATE OR REPLACE FUNCTION public.notify_inquiry_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE recipient uuid;
DECLARE inquiry_subject text;
BEGIN
  SELECT CASE WHEN NEW.sender_id = i.client_id THEN i.specialist_id ELSE i.client_id END, i.subject
  INTO recipient, inquiry_subject
  FROM public.specialist_inquiries i WHERE i.id = NEW.inquiry_id;
  IF recipient IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, kind, body)
    VALUES (recipient, 'message', 'Новое сообщение по заявке «' || inquiry_subject || '»');
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER inquiry_messages_notify
AFTER INSERT ON public.inquiry_messages
FOR EACH ROW EXECUTE FUNCTION public.notify_inquiry_message();

ALTER PUBLICATION supabase_realtime ADD TABLE public.specialist_inquiries;
ALTER PUBLICATION supabase_realtime ADD TABLE public.inquiry_messages;