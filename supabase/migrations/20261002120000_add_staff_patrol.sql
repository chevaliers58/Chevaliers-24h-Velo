-- 1. Add Staff patrol to the patrols table if not exists
insert into public.patrols (name, category)
select 'Staff', 'homme'::patrol_category
where not exists (select 1 from public.patrols where lower(name) = 'staff');

-- 2. Email confirmation remains controlled by Supabase Auth settings.
-- No automatic confirmation or anonymous confirmation RPC is installed.

-- 3. Upgrade handle_new_user trigger to save complete scout metadata directly into public.profiles
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  target_patrol_id uuid;
begin
  -- Resolve patrol id if passed as string or 'staff'
  if new.raw_user_meta_data->>'patrol_id' = 'staff' then
    select id into target_patrol_id from public.patrols where lower(name) = 'staff' limit 1;
  elsif new.raw_user_meta_data->>'patrol_id' ~ '^[0-9a-fA-F-]{36}$' then
    target_patrol_id := (new.raw_user_meta_data->>'patrol_id')::uuid;
  else
    target_patrol_id := null;
  end if;

  insert into public.profiles (
    id, email, full_name, totem, quali, scout_year, patrol_id, phone, onboarded
  )
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'totem',
    new.raw_user_meta_data->>'quali',
    case
      when new.raw_user_meta_data->>'scout_year' ~ '^[0-9]+$' then (new.raw_user_meta_data->>'scout_year')::smallint
      else null
    end,
    target_patrol_id,
    new.raw_user_meta_data->>'phone',
    true
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = coalesce(excluded.full_name, profiles.full_name),
    totem = coalesce(excluded.totem, profiles.totem),
    quali = coalesce(excluded.quali, profiles.quali),
    scout_year = coalesce(excluded.scout_year, profiles.scout_year),
    patrol_id = coalesce(excluded.patrol_id, profiles.patrol_id),
    phone = coalesce(excluded.phone, profiles.phone),
    onboarded = true;

  insert into public.user_roles (user_id, role)
  values (new.id, 'user')
  on conflict (user_id, role) do nothing;


  return new;
end; $$;
