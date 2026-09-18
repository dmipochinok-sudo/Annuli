create table if not exists public.site_sections (
  key text primary key,
  visible boolean not null default true,
  sort_order integer not null default 0,
  updated_at timestamptz not null default now()
);
alter table public.site_sections enable row level security;
drop policy if exists "Public can read site sections" on public.site_sections;
create policy "Public can read site sections" on public.site_sections for select to anon, authenticated using (true);
drop policy if exists "Admins can manage site sections" on public.site_sections;
create policy "Admins can manage site sections" on public.site_sections for all to authenticated using (public.is_admin()) with check (public.is_admin());
grant select on public.site_sections to anon;
grant select, insert, update, delete on public.site_sections to authenticated;
grant all on public.site_sections to service_role;
drop trigger if exists site_sections_set_updated_at on public.site_sections;
create trigger site_sections_set_updated_at before update on public.site_sections for each row execute function public.update_updated_at_column();

create table if not exists public.site_assets (
  key text primary key,
  url text not null default '',
  alt_ru text not null default '',
  alt_en text not null default '',
  updated_at timestamptz not null default now()
);
alter table public.site_assets enable row level security;
drop policy if exists "Public can read site assets" on public.site_assets;
create policy "Public can read site assets" on public.site_assets for select to anon, authenticated using (true);
drop policy if exists "Admins can manage site assets" on public.site_assets;
create policy "Admins can manage site assets" on public.site_assets for all to authenticated using (public.is_admin()) with check (public.is_admin());
grant select on public.site_assets to anon;
grant select, insert, update, delete on public.site_assets to authenticated;
grant all on public.site_assets to service_role;
drop trigger if exists site_assets_set_updated_at on public.site_assets;
create trigger site_assets_set_updated_at before update on public.site_assets for each row execute function public.update_updated_at_column();

create table if not exists public.site_addons (
  id uuid primary key default gen_random_uuid(),
  sort_order integer not null default 0,
  code text not null default '',
  name_ru text not null default '',
  name_en text not null default '',
  desc_ru text not null default '',
  desc_en text not null default '',
  price_ru text not null default '',
  price_en text not null default '',
  note_ru text not null default '',
  note_en text not null default '',
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.site_addons enable row level security;
drop policy if exists "Public can read site addons" on public.site_addons;
create policy "Public can read site addons" on public.site_addons for select to anon, authenticated using (true);
drop policy if exists "Admins can manage site addons" on public.site_addons;
create policy "Admins can manage site addons" on public.site_addons for all to authenticated using (public.is_admin()) with check (public.is_admin());
grant select on public.site_addons to anon;
grant select, insert, update, delete on public.site_addons to authenticated;
grant all on public.site_addons to service_role;
drop trigger if exists site_addons_set_updated_at on public.site_addons;
create trigger site_addons_set_updated_at before update on public.site_addons for each row execute function public.update_updated_at_column();