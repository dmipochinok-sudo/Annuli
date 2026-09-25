create table public.specialist_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  avatar_url text not null default '',
  specialization_ru text not null default '', specialization_en text not null default '',
  about_ru text not null default '', about_en text not null default '',
  regions_ru text not null default '', regions_en text not null default '',
  archives_ru text not null default '', archives_en text not null default '',
  activities_ru text not null default '', activities_en text not null default '',
  is_visible boolean not null default false,
  accepts_clients boolean not null default true,
  featured boolean not null default false,
  featured_order integer not null default 0,
  plan text not null default 'free',
  bases_limit integer not null default 10,
  storage_limit_mb integer not null default 1024,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.specialist_profiles to authenticated;
grant all on public.specialist_profiles to service_role;
alter table public.specialist_profiles enable row level security;
create policy "Own specialist profile read" on public.specialist_profiles for select to authenticated using (auth.uid() = user_id or public.is_admin());
create policy "Own specialist profile insert" on public.specialist_profiles for insert to authenticated with check (auth.uid() = user_id or public.is_admin());
create policy "Own specialist profile update" on public.specialist_profiles for update to authenticated using (auth.uid() = user_id or public.is_admin()) with check (auth.uid() = user_id or public.is_admin());
create policy "Admins delete specialist profile" on public.specialist_profiles for delete to authenticated using (public.is_admin());

create or replace function public.guard_specialist_profile()
returns trigger language plpgsql set search_path = public as $$
begin
  if not public.is_admin() then
    if tg_op = 'INSERT' then
      new.featured := false; new.featured_order := 0; new.plan := 'free'; new.bases_limit := 10; new.storage_limit_mb := 1024;
    else
      new.featured := old.featured; new.featured_order := old.featured_order; new.plan := old.plan;
      new.bases_limit := old.bases_limit; new.storage_limit_mb := old.storage_limit_mb;
    end if;
  end if;
  return new;
end; $$;
create trigger specialist_profiles_guard before insert or update on public.specialist_profiles for each row execute function public.guard_specialist_profile();
create trigger specialist_profiles_set_updated_at before update on public.specialist_profiles for each row execute function public.update_updated_at_column();

create table public.specialist_rates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null default 'fixed' check (kind in ('fixed','open')),
  name_ru text not null default '', name_en text not null default '',
  price_ru text not null default '', price_en text not null default '',
  term_ru text not null default '', term_en text not null default '',
  includes_ru text not null default '', includes_en text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.specialist_rates to authenticated;
grant all on public.specialist_rates to service_role;
alter table public.specialist_rates enable row level security;
create policy "Own rates manage" on public.specialist_rates for all to authenticated using (auth.uid() = user_id or public.is_admin()) with check (auth.uid() = user_id or public.is_admin());
create trigger specialist_rates_set_updated_at before update on public.specialist_rates for each row execute function public.update_updated_at_column();

create table public.specialist_reviews (
  id uuid primary key default gen_random_uuid(),
  specialist_id uuid not null references auth.users(id) on delete cascade,
  client_id uuid references auth.users(id) on delete set null,
  client_name text not null default '',
  body text not null default '',
  reply text not null default '',
  is_published boolean not null default false,
  order_confirmed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.specialist_reviews to authenticated;
grant all on public.specialist_reviews to service_role;
alter table public.specialist_reviews enable row level security;
create policy "Reviews read" on public.specialist_reviews for select to authenticated using (auth.uid() = specialist_id or auth.uid() = client_id or public.is_admin());
create policy "Staff manage reviews" on public.specialist_reviews for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Specialist replies" on public.specialist_reviews for update to authenticated using (auth.uid() = specialist_id) with check (auth.uid() = specialist_id);
create or replace function public.guard_review_reply()
returns trigger language plpgsql set search_path = public as $$
begin
  if not public.is_admin() then
    new.specialist_id := old.specialist_id; new.client_id := old.client_id; new.client_name := old.client_name;
    new.body := old.body; new.is_published := old.is_published; new.order_confirmed := old.order_confirmed;
  end if;
  return new;
end; $$;
create trigger specialist_reviews_guard before update on public.specialist_reviews for each row execute function public.guard_review_reply();
create trigger specialist_reviews_set_updated_at before update on public.specialist_reviews for each row execute function public.update_updated_at_column();

-- Genealogy bases
create table public.genealogy_bases (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'Моя база',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.genealogy_bases to authenticated;
grant all on public.genealogy_bases to service_role;
alter table public.genealogy_bases enable row level security;
create policy "Own bases manage" on public.genealogy_bases for all to authenticated using (auth.uid() = owner_id or public.is_admin()) with check (auth.uid() = owner_id or public.is_admin());
create policy "Grantees view bases" on public.genealogy_bases for select to authenticated using (public.has_base_access(owner_id));
create trigger genealogy_bases_set_updated_at before update on public.genealogy_bases for each row execute function public.update_updated_at_column();

create or replace function public.bases_limit_for(_user uuid)
returns integer language sql stable security definer set search_path = public as $$
  select coalesce((select bases_limit from public.specialist_profiles where user_id = _user),
    case when exists (select 1 from public.user_product_roles where user_id = _user and product_role = 'specialist') then 10 else 1 end);
$$;
revoke execute on function public.bases_limit_for(uuid) from public, anon;
grant execute on function public.bases_limit_for(uuid) to authenticated;

create or replace function public.enforce_bases_limit()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if public.is_admin() then return new; end if;
  if (select count(*) from public.genealogy_bases where owner_id = new.owner_id) >= public.bases_limit_for(new.owner_id) then
    raise exception 'Достигнут лимит баз по тарифу';
  end if;
  return new;
end; $$;
create trigger genealogy_bases_limit before insert on public.genealogy_bases for each row execute function public.enforce_bases_limit();

alter table public.persons add column base_id uuid references public.genealogy_bases(id) on delete cascade;
insert into public.genealogy_bases (owner_id, title)
  select distinct owner_id, 'Моя база' from public.persons;
update public.persons p set base_id = b.id from public.genealogy_bases b where b.owner_id = p.owner_id and p.base_id is null;
create index persons_base_id_idx on public.persons(base_id);

-- Public featured specialists
create or replace function public.list_featured_specialists()
returns table(user_id uuid, full_name text, avatar_url text, specialization_ru text, specialization_en text,
  about_ru text, about_en text, regions_ru text, regions_en text, archives_ru text, archives_en text,
  activities_ru text, activities_en text, accepts_clients boolean, featured_order integer, rates jsonb, reviews jsonb)
language sql stable security definer set search_path = public as $$
  select s.user_id, coalesce(nullif(p.display_name,''), 'Специалист'), s.avatar_url,
    s.specialization_ru, s.specialization_en, s.about_ru, s.about_en, s.regions_ru, s.regions_en,
    s.archives_ru, s.archives_en, s.activities_ru, s.activities_en, s.accepts_clients, s.featured_order,
    coalesce((select jsonb_agg(jsonb_build_object('kind',r.kind,'name_ru',r.name_ru,'name_en',r.name_en,'price_ru',r.price_ru,'price_en',r.price_en,'term_ru',r.term_ru,'term_en',r.term_en) order by r.sort_order, r.created_at) from public.specialist_rates r where r.user_id = s.user_id), '[]'::jsonb),
    coalesce((select jsonb_agg(jsonb_build_object('client_name',v.client_name,'body',v.body,'reply',v.reply,'created_at',v.created_at) order by v.created_at desc) from public.specialist_reviews v where v.specialist_id = s.user_id and v.is_published), '[]'::jsonb)
  from public.specialist_profiles s join public.profiles p on p.id = s.user_id
  where s.featured and s.is_visible and not p.is_blocked
  order by s.featured_order, p.display_name
  limit 6;
$$;
grant execute on function public.list_featured_specialists() to anon, authenticated;

create or replace function public.staff_list_specialists()
returns table(user_id uuid, full_name text, email text, has_card boolean, is_visible boolean, accepts_clients boolean,
  featured boolean, featured_order integer, plan text, bases_limit integer, bases_count bigint)
language sql stable security definer set search_path = public as $$
  select p.id, coalesce(nullif(p.display_name,''), p.email), p.email, s.user_id is not null,
    coalesce(s.is_visible,false), coalesce(s.accepts_clients,true), coalesce(s.featured,false), coalesce(s.featured_order,0),
    coalesce(s.plan,'free'), coalesce(s.bases_limit,10),
    (select count(*) from public.genealogy_bases b where b.owner_id = p.id)
  from public.profiles p join public.user_product_roles r on r.user_id = p.id and r.product_role = 'specialist'
  left join public.specialist_profiles s on s.user_id = p.id
  where public.is_admin()
  order by coalesce(s.featured,false) desc, coalesce(s.featured_order,0), 2;
$$;
revoke execute on function public.staff_list_specialists() from public, anon;
grant execute on function public.staff_list_specialists() to authenticated;

insert into public.site_sections (key, visible, sort_order) values ('specialists', true, 55) on conflict (key) do nothing;

create policy "Specialists upload own avatar" on storage.objects for insert to authenticated
  with check (bucket_id = 'site-assets' and (storage.foldername(name))[1] = 'specialists' and (storage.foldername(name))[2] = auth.uid()::text);
create policy "Specialists update own avatar" on storage.objects for update to authenticated
  using (bucket_id = 'site-assets' and (storage.foldername(name))[1] = 'specialists' and (storage.foldername(name))[2] = auth.uid()::text);
create policy "Specialists delete own avatar" on storage.objects for delete to authenticated
  using (bucket_id = 'site-assets' and (storage.foldername(name))[1] = 'specialists' and (storage.foldername(name))[2] = auth.uid()::text);