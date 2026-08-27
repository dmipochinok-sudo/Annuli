-- 1) Выдать роль admin существующему пользователю
insert into public.user_roles (user_id, role)
select u.id, 'admin'::app_role
from auth.users u
where lower(u.email) = 'dm.i.pochinok@gmail.com'
on conflict (user_id, role) do nothing;

-- Убрать у него роль 'user', если была
delete from public.user_roles ur
using auth.users u
where ur.user_id = u.id
  and lower(u.email) = 'dm.i.pochinok@gmail.com'
  and ur.role = 'user'::app_role;

-- 2) Автоматическая выдача admin при регистрации этой почты
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  insert into public.profiles (id, display_name, email, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'avatar_url', '')
  );

  if lower(coalesce(new.email, '')) = 'dm.i.pochinok@gmail.com'
     or not exists (select 1 from public.user_roles where role = 'admin') then
    insert into public.user_roles (user_id, role) values (new.id, 'admin')
    on conflict (user_id, role) do nothing;
  else
    insert into public.user_roles (user_id, role) values (new.id, 'user')
    on conflict (user_id, role) do nothing;
  end if;

  return new;
end;
$function$;