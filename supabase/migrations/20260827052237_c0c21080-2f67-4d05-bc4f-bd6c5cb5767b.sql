create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to authenticated, service_role;

create or replace function private.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  )
$$;

revoke execute on function private.has_role(uuid, public.app_role) from public, anon;
grant execute on function private.has_role(uuid, public.app_role) to authenticated, service_role;

drop policy if exists "Admins can view all profiles" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Admins can update any profile" on public.profiles;
drop policy if exists "Admins can view all roles" on public.user_roles;

create policy "Admins can view all profiles" on public.profiles
  for select to authenticated using (private.has_role(auth.uid(), 'admin'));

create policy "Users can update own profile" on public.profiles
  for update to authenticated
  using (auth.uid() = id and not private.has_role(auth.uid(), 'admin'))
  with check (auth.uid() = id and is_blocked = false);

create policy "Admins can update any profile" on public.profiles
  for update to authenticated using (private.has_role(auth.uid(), 'admin'));

create policy "Admins can view all roles" on public.user_roles
  for select to authenticated using (private.has_role(auth.uid(), 'admin'));

drop function if exists public.has_role(uuid, public.app_role);

create or replace function public.is_admin()
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = auth.uid() and role = 'admin'
  )
$$;

revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;