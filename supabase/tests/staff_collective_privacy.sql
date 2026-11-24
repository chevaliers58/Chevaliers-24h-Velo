-- Synthetic, rollback-only exercise after official season gate and candidate projection.
\set ON_ERROR_STOP on
begin;
insert into public.patrols(id,name,category) values
('f2000000-0000-4000-8000-000000000001','Projection Test Scouts','homme'),
('f2000000-0000-4000-8000-000000000002','Projection Test Staff','staff');
insert into auth.users(id,email,email_confirmed_at,raw_user_meta_data) values
('f3000000-0000-4000-8000-000000000001','public-scout@local-test.invalid',now(),'{"full_name":"Projection Scout"}'),
('f3000000-0000-4000-8000-000000000002','public-staff@local-test.invalid',now(),'{"full_name":"Projection Staff"}'),
('f3000000-0000-4000-8000-000000000003','public-admin@local-test.invalid',now(),'{"full_name":"Projection Admin"}');
update public.profiles set patrol_id='f2000000-0000-4000-8000-000000000001' where id in
('f3000000-0000-4000-8000-000000000001','f3000000-0000-4000-8000-000000000003');
update public.profiles set patrol_id='f2000000-0000-4000-8000-000000000002' where id='f3000000-0000-4000-8000-000000000002';
insert into public.user_roles(user_id,role) values ('f3000000-0000-4000-8000-000000000003','admin');
update public.annual_points_settings set starts_on='2026-09-27',ends_on='2099-12-31',enabled=true;
insert into public.activities(user_id,ride_date,km,strava_link) values
('f3000000-0000-4000-8000-000000000001','2026-11-09',10,'https://www.strava.com/activities/990010'),
('f3000000-0000-4000-8000-000000000002','2026-11-09',20,'https://www.strava.com/activities/990020'),
('f3000000-0000-4000-8000-000000000002','2026-11-09',30,'https://www.strava.com/activities/990030'),
('f3000000-0000-4000-8000-000000000003','2026-11-09',40,'https://www.strava.com/activities/990040');
insert into public.activities(user_id,ride_date,km,proof_path,status) values
('f3000000-0000-4000-8000-000000000002','2026-11-09',999,'synthetic-pending.jpg','pending');
set local role anon;
select set_config('request.jwt.claim.sub','',true);
select set_config('request.jwt.claims','{"role":"anon"}',true);
do $test$
begin
  if exists(select 1 from public.activities_public where user_id in
    ('f3000000-0000-4000-8000-000000000002','f3000000-0000-4000-8000-000000000003')) then
    raise exception 'Staff rows visible to anon'; end if;
  if not exists(select 1 from public.activities_public where user_id='f3000000-0000-4000-8000-000000000001' and km=10) then
    raise exception 'Scout distance missing'; end if;
  if not exists(select 1 from public.staff_collective_distances() where patrol_id='f2000000-0000-4000-8000-000000000002' and km=50 and rides=2) then
    raise exception 'Staff aggregate missing'; end if;
  if not exists(select 1 from public.staff_collective_distances() where patrol_id='f2000000-0000-4000-8000-000000000001' and km=40 and rides=1) then
    raise exception 'Admin contribution to regular patrol missing'; end if;
  if exists(select 1 from public.staff_collective_distances('2026-11-10','2026-11-11') where patrol_id in
    ('f2000000-0000-4000-8000-000000000001','f2000000-0000-4000-8000-000000000002')) then
    raise exception 'Aggregate date filter failed'; end if;
  if exists(select 1 from public.leaderboard(null,null) where user_id in
    ('f3000000-0000-4000-8000-000000000002','f3000000-0000-4000-8000-000000000003')) then
    raise exception 'Staff legacy leaderboard visible'; end if;
end;
$test$;
reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub','f3000000-0000-4000-8000-000000000001',true);
select set_config('request.jwt.claims','{"sub":"f3000000-0000-4000-8000-000000000001","role":"authenticated"}',true);
do $test$
begin
  if exists(select 1 from public.activities where user_id in
    ('f3000000-0000-4000-8000-000000000002','f3000000-0000-4000-8000-000000000003')) then
    raise exception 'Scout can read staff base rows'; end if;
  if exists(select 1 from public.activities_public where user_id in
    ('f3000000-0000-4000-8000-000000000002','f3000000-0000-4000-8000-000000000003')) then
    raise exception 'Scout can read staff public rows'; end if;
end;
$test$;
select set_config('request.jwt.claim.sub','f3000000-0000-4000-8000-000000000003',true);
select set_config('request.jwt.claims','{"sub":"f3000000-0000-4000-8000-000000000003","role":"authenticated"}',true);
do $test$
begin
  if not exists(select 1 from public.activities where user_id=auth.uid() and km=40) then raise exception 'Admin own ride missing'; end if;
end;
$test$;
reset role;
rollback;
\echo 'STAFF_COLLECTIVE_PRIVACY_OK'
