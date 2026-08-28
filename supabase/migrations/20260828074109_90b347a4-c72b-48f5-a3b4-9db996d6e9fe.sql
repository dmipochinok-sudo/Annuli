CREATE TABLE public.persons (
  id text NOT NULL PRIMARY KEY,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  person_index text NOT NULL DEFAULT '',
  full_name text NOT NULL DEFAULT '',
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX persons_owner_idx ON public.persons (owner_id);
CREATE INDEX persons_owner_index_idx ON public.persons (owner_id, person_index);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.persons TO authenticated;
GRANT ALL ON public.persons TO service_role;

ALTER TABLE public.persons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own persons"
  ON public.persons FOR ALL TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Admins manage all persons"
  ON public.persons FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER persons_set_updated_at
  BEFORE UPDATE ON public.persons
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();