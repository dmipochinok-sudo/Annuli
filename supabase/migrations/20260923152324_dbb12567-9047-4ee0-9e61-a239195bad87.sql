create table if not exists public.user_product_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  product_role text not null default 'client' check (product_role in ('client','specialist')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

grant select, insert on public.user_product_roles to authenticated;
grant all on public.user_product_roles to service_role;
alter table public.user_product_roles enable row level security;

create table if not exists public.user_owner_flags (
  user_id uuid primary key references auth.users(id) on delete cascade,
  is_owner boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant all on public.user_owner_flags to service_role;
alter table public.user_owner_flags enable row level security;

create table if not exists public.role_audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor uuid references auth.users(id) on delete set null,
  target uuid references auth.users(id) on delete set null,
  action text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
grant all on public.role_audit_logs to service_role;
alter table public.role_audit_logs enable row level security;

drop trigger if exists user_product_roles_set_updated_at on public.user_product_roles;
create trigger user_product_roles_set_updated_at
  before update on public.user_product_roles
  for each row execute function public.update_updated_at_column();

drop trigger if exists user_owner_flags_set_updated_at on public.user_owner_flags;
create trigger user_owner_flags_set_updated_at
  before update on public.user_owner_flags
  for each row execute function public.update_updated_at_column();

create or replace function public.is_owner()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_owner_flags
    where user_id = auth.uid() and is_owner = true
  );
$$;
revoke execute on function public.is_owner() from public, anon;
grant execute on function public.is_owner() to authenticated;

create or replace function public.current_app_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select case
    when public.is_owner() then 'owner'
    when public.is_admin() then 'admin'
    when exists (
      select 1 from public.user_product_roles
      where user_id = auth.uid() and product_role = 'specialist'
    ) then 'specialist'
    else 'client'
  end;
$$;
revoke execute on function public.current_app_role() from public, anon;
grant execute on function public.current_app_role() to authenticated;

create or replace function public.register_product_role(requested_role text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if requested_role not in ('client','specialist') then
    raise exception 'Invalid product role';
  end if;
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;
  insert into public.user_product_roles (user_id, product_role)
  values (auth.uid(), requested_role)
  on conflict (user_id) do nothing;
end;
$$;
revoke execute on function public.register_product_role(text) from public, anon;
grant execute on function public.register_product_role(text) to authenticated;

create or replace function public.set_user_product_role(target_user uuid, new_role text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_owner() then
    raise exception 'Only owner can change product roles';
  end if;
  if new_role not in ('client','specialist') then
    raise exception 'Invalid product role';
  end if;
  insert into public.user_product_roles (user_id, product_role)
  values (target_user, new_role)
  on conflict (user_id) do update set product_role = excluded.product_role, updated_at = now();

  insert into public.role_audit_logs (actor, target, action, details)
  values (auth.uid(), target_user, 'set_product_role', jsonb_build_object('role', new_role));
end;
$$;
revoke execute on function public.set_user_product_role(uuid, text) from public, anon;
grant execute on function public.set_user_product_role(uuid, text) to authenticated;

create or replace function public.set_user_admin(target_user uuid, make_admin boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_owner() then
    raise exception 'Only owner can manage admins';
  end if;
  if make_admin then
    insert into public.user_roles (user_id, role)
    values (target_user, 'admin')
    on conflict (user_id, role) do nothing;
  else
    if exists (select 1 from public.user_owner_flags where user_id = target_user and is_owner = true) then
      raise exception 'Cannot remove admin rights from an owner';
    end if;
    delete from public.user_roles where user_id = target_user and role = 'admin';
    insert into public.user_roles (user_id, role)
    values (target_user, 'user')
    on conflict (user_id, role) do nothing;
  end if;

  insert into public.role_audit_logs (actor, target, action, details)
  values (auth.uid(), target_user, case when make_admin then 'grant_admin' else 'revoke_admin' end, '{}'::jsonb);
end;
$$;
revoke execute on function public.set_user_admin(uuid, boolean) from public, anon;
grant execute on function public.set_user_admin(uuid, boolean) to authenticated;

create or replace function public.set_user_owner(target_user uuid, make_owner boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  owner_count integer;
begin
  if not public.is_owner() then
    raise exception 'Only owner can manage owners';
  end if;

  if make_owner then
    insert into public.user_owner_flags (user_id, is_owner)
    values (target_user, true)
    on conflict (user_id) do update set is_owner = true, updated_at = now();

    insert into public.user_roles (user_id, role)
    values (target_user, 'admin')
    on conflict (user_id, role) do nothing;
  else
    if target_user = auth.uid() then
      raise exception 'Owner cannot remove owner status from themselves';
    end if;
    select count(*) into owner_count from public.user_owner_flags where is_owner = true;
    if owner_count <= 1 then
      raise exception 'Cannot remove the last owner';
    end if;
    delete from public.user_owner_flags where user_id = target_user;
  end if;

  insert into public.role_audit_logs (actor, target, action, details)
  values (auth.uid(), target_user, case when make_owner then 'grant_owner' else 'revoke_owner' end, '{}'::jsonb);
end;
$$;
revoke execute on function public.set_user_owner(uuid, boolean) from public, anon;
grant execute on function public.set_user_owner(uuid, boolean) to authenticated;

create or replace function public.owner_list_users()
returns table (
  id uuid,
  display_name text,
  email text,
  avatar_url text,
  is_blocked boolean,
  created_at timestamptz,
  product_role text,
  is_admin boolean,
  is_owner boolean
)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.id,
    p.display_name,
    p.email,
    p.avatar_url,
    p.is_blocked,
    p.created_at,
    coalesce(pr.product_role, 'client') as product_role,
    exists (select 1 from public.user_roles r where r.user_id = p.id and r.role = 'admin') as is_admin,
    coalesce(of.is_owner, false) as is_owner
  from public.profiles p
  left join public.user_product_roles pr on pr.user_id = p.id
  left join public.user_owner_flags of on of.user_id = p.id
  where public.is_owner()
  order by p.created_at asc;
$$;
revoke execute on function public.owner_list_users() from public, anon;
grant execute on function public.owner_list_users() to authenticated;

drop policy if exists "Users can view own product role" on public.user_product_roles;
create policy "Users can view own product role"
  on public.user_product_roles for select to authenticated
  using (auth.uid() = user_id or public.is_owner());

drop policy if exists "Users can insert own product role" on public.user_product_roles;
create policy "Users can insert own product role"
  on public.user_product_roles for insert to authenticated
  with check (auth.uid() = user_id and product_role in ('client','specialist'));

drop policy if exists "Owner can update product roles" on public.user_product_roles;
create policy "Owner can update product roles"
  on public.user_product_roles for update to authenticated
  using (public.is_owner()) with check (public.is_owner());

drop policy if exists "Owner can delete product roles" on public.user_product_roles;
create policy "Owner can delete product roles"
  on public.user_product_roles for delete to authenticated
  using (public.is_owner());

insert into public.user_owner_flags (user_id, is_owner)
select p.id, true
from public.profiles p
join public.user_roles r on r.user_id = p.id and r.role = 'admin'
where not exists (select 1 from public.user_owner_flags where is_owner = true)
order by p.created_at asc
limit 1
on conflict (user_id) do nothing;