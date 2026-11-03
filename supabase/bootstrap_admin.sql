-- Bootstrap the first administrator for this independent troupe project.
-- 1. Create the administrator's account through the app first.
-- 2. Replace the email below with that account's exact email address.
-- 3. Run this once in Supabase SQL Editor as the project owner.
-- This does not copy or modify any account from the source troupe.

do $$
declare
  admin_email text := 'REPLACE_WITH_YOUR_ADMIN_EMAIL';
  admin_user_id uuid;
begin
  select id into admin_user_id
  from auth.users
  where lower(email) = lower(admin_email)
  limit 1;

  if admin_user_id is null then
    raise exception 'No Supabase Auth account found for %. Create the account first.', admin_email;
  end if;

  insert into public.user_roles (user_id, role)
  values (admin_user_id, 'admin'::public.app_role)
  on conflict (user_id, role) do nothing;
end;
$$;
