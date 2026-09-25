ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS phone text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS city text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS note text NOT NULL DEFAULT '';

CREATE SEQUENCE IF NOT EXISTS public.book_order_seq START 1001;
GRANT USAGE ON SEQUENCE public.book_order_seq TO authenticated, service_role;
ALTER TABLE public.book_projects
  ADD COLUMN IF NOT EXISTS order_no text NOT NULL DEFAULT ('ORD-' || nextval('public.book_order_seq')::text),
  ADD COLUMN IF NOT EXISTS amount integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS paid_amount integer NOT NULL DEFAULT 0;

-- Clients only read their orders; staff manage.
DROP POLICY IF EXISTS "Users manage own projects" ON public.book_projects;
CREATE POLICY "Users view own projects" ON public.book_projects FOR SELECT TO authenticated USING (auth.uid() = owner_id);

CREATE TABLE public.base_access_grants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  grantee_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  level text NOT NULL DEFAULT 'view' CHECK (level IN ('view','edit')),
  expires_at timestamptz,
  consent_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.base_access_grants TO authenticated;
GRANT ALL ON public.base_access_grants TO service_role;
ALTER TABLE public.base_access_grants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner or grantee view grants" ON public.base_access_grants FOR SELECT TO authenticated
  USING (auth.uid() = owner_id OR auth.uid() = grantee_id OR public.is_admin());
CREATE POLICY "Owner creates grants" ON public.base_access_grants FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = owner_id AND grantee_id <> owner_id AND revoked_at IS NULL);
CREATE POLICY "Owner or staff update grants" ON public.base_access_grants FOR UPDATE TO authenticated
  USING (auth.uid() = owner_id OR public.is_admin()) WITH CHECK (auth.uid() = owner_id OR public.is_admin());
CREATE TRIGGER base_access_grants_set_updated_at BEFORE UPDATE ON public.base_access_grants
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind text NOT NULL DEFAULT 'info',
  body text NOT NULL DEFAULT '',
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own notifications" ON public.notifications FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "Users mark own notifications" ON public.notifications FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Specialists read a client's base while a grant is active.
CREATE OR REPLACE FUNCTION public.has_base_access(_owner uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  select exists (select 1 from public.base_access_grants g
    where g.owner_id = _owner and g.grantee_id = auth.uid()
      and g.revoked_at is null and (g.expires_at is null or g.expires_at > now()));
$$;
CREATE POLICY "Grantees view granted persons" ON public.persons FOR SELECT TO authenticated
  USING (public.has_base_access(owner_id));

-- Public list of specialists (name only) for granting access.
CREATE OR REPLACE FUNCTION public.list_specialists()
RETURNS TABLE(id uuid, display_name text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  select p.id, coalesce(nullif(p.display_name,''), p.email)
  from public.profiles p join public.user_product_roles r on r.user_id = p.id
  where r.product_role = 'specialist' and not p.is_blocked and auth.uid() is not null
  order by 2;
$$;

CREATE OR REPLACE FUNCTION public.notify_project_status()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
begin
  if tg_op = 'INSERT' then
    insert into public.notifications (user_id, kind, body)
    values (new.owner_id, 'order', 'Создан заказ ' || new.order_no || ': «' || new.title || '»');
  elsif new.status is distinct from old.status then
    insert into public.notifications (user_id, kind, body)
    values (new.owner_id, 'order', 'Заказ ' || new.order_no || ': статус «' || new.status || '»');
  end if;
  return new;
end; $$;
CREATE TRIGGER book_projects_notify AFTER INSERT OR UPDATE ON public.book_projects
  FOR EACH ROW EXECUTE FUNCTION public.notify_project_status();

CREATE OR REPLACE FUNCTION public.notify_access_grant()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
declare _g text; _o text;
begin
  select coalesce(nullif(display_name,''), email) into _g from public.profiles where id = new.grantee_id;
  select coalesce(nullif(display_name,''), email) into _o from public.profiles where id = new.owner_id;
  if tg_op = 'INSERT' then
    insert into public.notifications (user_id, kind, body) values
      (new.owner_id, 'access', 'Выдан доступ к базе специалисту ' || coalesce(_g,'')),
      (new.grantee_id, 'access', 'Вам выдан доступ к базе клиента ' || coalesce(_o,''));
  elsif new.revoked_at is not null and old.revoked_at is null then
    insert into public.notifications (user_id, kind, body) values
      (new.owner_id, 'access', 'Доступ специалиста ' || coalesce(_g,'') || ' отозван'),
      (new.grantee_id, 'access', 'Доступ к базе клиента ' || coalesce(_o,'') || ' отозван');
  end if;
  return new;
end; $$;
CREATE TRIGGER base_access_grants_notify AFTER INSERT OR UPDATE ON public.base_access_grants
  FOR EACH ROW EXECUTE FUNCTION public.notify_access_grant();