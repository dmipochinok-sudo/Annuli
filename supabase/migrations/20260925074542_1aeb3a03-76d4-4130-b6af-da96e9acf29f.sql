ALTER TABLE public.role_audit_logs
  ADD COLUMN category text NOT NULL DEFAULT 'roles',
  ADD COLUMN actor_email text NOT NULL DEFAULT '',
  ADD COLUMN target_email text NOT NULL DEFAULT '';

CREATE OR REPLACE FUNCTION public.log_action(_category text, _action text, _target uuid DEFAULT NULL, _details jsonb DEFAULT '{}'::jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
declare
  _actor_email text := '';
  _target_email text := '';
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;
  select email into _actor_email from public.profiles where id = auth.uid();
  if _target is not null then
    select email into _target_email from public.profiles where id = _target;
  end if;
  insert into public.role_audit_logs (actor, target, action, details, category, actor_email, target_email)
  values (auth.uid(), _target, _action, coalesce(_details, '{}'::jsonb), _category, coalesce(_actor_email, ''), coalesce(_target_email, ''));
end;
$$;

CREATE OR REPLACE FUNCTION public.list_audit_logs(_limit integer DEFAULT 100, _offset integer DEFAULT 0, _category text DEFAULT NULL)
RETURNS TABLE(id uuid, created_at timestamptz, category text, action text, actor_email text, target_email text, details jsonb)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  select l.id, l.created_at, l.category, l.action, l.actor_email, l.target_email, l.details
  from public.role_audit_logs l
  where (public.is_owner() or public.is_admin())
    and (_category is null or l.category = _category)
  order by l.created_at desc
  limit least(greatest(_limit, 1), 500)
  offset greatest(_offset, 0);
$$;

REVOKE ALL ON FUNCTION public.log_action(text, text, uuid, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.log_action(text, text, uuid, jsonb) TO authenticated;
REVOKE ALL ON FUNCTION public.list_audit_logs(integer, integer, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.list_audit_logs(integer, integer, text) TO authenticated;