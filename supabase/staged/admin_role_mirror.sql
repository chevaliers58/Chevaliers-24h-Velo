-- Candidate: keep the profile's display flag an exact mirror of the authoritative role.
-- The existing BEFORE trigger calls this function; the role-table AFTER trigger
-- remains responsible for synchronizing the flag when an administrator is added/removed.
create or replace function public.protect_profile_admin_flag()
returns trigger language plpgsql security definer set search_path='' as $$
begin
  new.is_admin := exists (
    select 1 from public.user_roles r where r.user_id=new.id and r.role='admin'
  );
  return new;
end;
$$;
revoke all on function public.protect_profile_admin_flag() from public,anon,authenticated;
-- Correct any pre-existing inconsistent flag without modifying other profile fields.
update public.profiles p
   set is_admin=exists(select 1 from public.user_roles r where r.user_id=p.id and r.role='admin')
 where p.is_admin is distinct from exists(
   select 1 from public.user_roles r where r.user_id=p.id and r.role='admin'
 );
