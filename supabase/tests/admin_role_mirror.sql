-- Isolated, rollback-only role mirror regression; never use real accounts.
\set ON_ERROR_STOP on
begin;
insert into auth.users(id,email,email_confirmed_at,raw_user_meta_data) values
('f4000000-0000-4000-8000-000000000001','role-admin@local-test.invalid',now(),'{"full_name":"Role Admin"}'),
('f4000000-0000-4000-8000-000000000002','role-scout@local-test.invalid',now(),'{"full_name":"Role Scout"}');
insert into public.user_roles(user_id,role) values ('f4000000-0000-4000-8000-000000000001','admin');

set local role authenticated;
select set_config('request.jwt.claim.sub','f4000000-0000-4000-8000-000000000002',true);
select set_config('request.jwt.claims','{"sub":"f4000000-0000-4000-8000-000000000002","role":"authenticated"}',true);
do $test$
begin
  update public.profiles set is_admin=true where id=auth.uid();
  if exists(select 1 from public.profiles where id=auth.uid() and is_admin) then
    raise exception 'Scout can forge role display flag'; end if;
end;
$test$;
select set_config('request.jwt.claim.sub','f4000000-0000-4000-8000-000000000001',true);
select set_config('request.jwt.claims','{"sub":"f4000000-0000-4000-8000-000000000001","role":"authenticated"}',true);
do $test$
declare scout uuid := 'f4000000-0000-4000-8000-000000000002';
begin
  update public.profiles set is_admin=false where id=auth.uid();
  if not exists(select 1 from public.profiles where id=auth.uid() and is_admin) then
    raise exception 'Admin can hide their role from public classifications'; end if;
  update public.profiles set is_admin=true where id=scout;
  if exists(select 1 from public.profiles where id=scout and is_admin) then
    raise exception 'Admin can forge role display flag without granting role'; end if;
  perform public.set_admin_by_email('role-scout@local-test.invalid',true);
  if not exists(select 1 from public.profiles where id=scout and is_admin) then
    raise exception 'Grant did not synchronize flag'; end if;
  perform public.set_admin_by_email('role-scout@local-test.invalid',false);
  if exists(select 1 from public.profiles where id=scout and is_admin) then
    raise exception 'Revocation did not synchronize flag'; end if;
end;
$test$;
reset role;
rollback;
\echo 'ADMIN_ROLE_MIRROR_OK'
