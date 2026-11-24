-- Run only in a disposable local DB after private_proofs_candidate.sql.
-- Synthetic object metadata only; no physical objects or production accounts.
\set ON_ERROR_STOP on
begin;
insert into auth.users(id,email,email_confirmed_at,raw_user_meta_data) values
('c1000000-0000-4000-8000-000000000001','proof-owner@local-test.invalid',now(),'{"full_name":"Proof owner"}'),
('c1000000-0000-4000-8000-000000000002','proof-other@local-test.invalid',now(),'{"full_name":"Proof other"}'),
('c1000000-0000-4000-8000-000000000003','proof-staff@local-test.invalid',now(),'{"full_name":"Proof staff"}');
insert into public.user_roles(user_id,role) values ('c1000000-0000-4000-8000-000000000003','admin');
do $test$
begin
  if not exists(select 1 from storage.buckets where id='proofs' and not public) then
    raise exception 'Proof bucket not private';
  end if;
  if not exists(select 1 from storage.buckets where id='backgrounds' and public) then
    raise exception 'Background bucket unexpectedly changed';
  end if;
end;
$test$;
set local role authenticated;
select set_config('request.jwt.claim.sub','c1000000-0000-4000-8000-000000000001',true);
select set_config('request.jwt.claims','{"sub":"c1000000-0000-4000-8000-000000000001","role":"authenticated"}',true);
insert into storage.objects(bucket_id,name) values
('proofs','c1000000-0000-4000-8000-000000000001_test-photo.jpg'),
('proofs','c1000000-0000-4000-8000-000000000001_test-track.gpx');
do $test$
begin
  if exists(select 1 from storage.objects where bucket_id='proofs') then
    raise exception 'Owner can read proof metadata';
  end if;
  begin
    insert into storage.objects(bucket_id,name) values ('proofs','c1000000-0000-4000-8000-000000000002_forged.jpg');
    raise exception 'Owner can upload for another account';
  exception when insufficient_privilege then null;
  end;
end;
$test$;
select set_config('request.jwt.claim.sub','c1000000-0000-4000-8000-000000000002',true);
select set_config('request.jwt.claims','{"sub":"c1000000-0000-4000-8000-000000000002","role":"authenticated"}',true);
do $test$
begin
  if exists(select 1 from storage.objects where bucket_id='proofs') then
    raise exception 'Other scout can read proof metadata';
  end if;
end;
$test$;
select set_config('request.jwt.claim.sub','c1000000-0000-4000-8000-000000000003',true);
select set_config('request.jwt.claims','{"sub":"c1000000-0000-4000-8000-000000000003","role":"authenticated"}',true);
do $test$
begin
  if (select count(*) from storage.objects where bucket_id='proofs'
      and name like 'c1000000-0000-4000-8000-000000000001_%') <> 2 then
    raise exception 'Authorized staff cannot read proofs';
  end if;
end;
$test$;
reset role;
set local role anon;
select set_config('request.jwt.claim.sub','',true);
select set_config('request.jwt.claims','{"role":"anon"}',true);
do $test$
begin
  if exists(select 1 from storage.objects where bucket_id='proofs') then
    raise exception 'Anonymous user can read proofs';
  end if;
end;
$test$;
reset role;
rollback;
\echo 'PRIVATE_PROOFS_CANDIDATE_OK'
