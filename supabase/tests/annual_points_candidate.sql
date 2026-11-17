-- Disposable database only, synthetic rows roll back.
\set ON_ERROR_STOP on
begin;
insert into public.patrols(id,name,category) values
('a1000000-0000-4000-8000-000000000001','Points test A','homme'),
('a1000000-0000-4000-8000-000000000002','Points test B','homme'),
('a1000000-0000-4000-8000-000000000003','Points test Staff','staff');
insert into auth.users(id,email,email_confirmed_at,raw_user_meta_data) values
('b1000000-0000-4000-8000-000000000001','young-points@local-test.invalid',now(),'{"full_name":"Young Test"}'),
('b1000000-0000-4000-8000-000000000002','senior-points@local-test.invalid',now(),'{"full_name":"Senior Test"}'),
('b1000000-0000-4000-8000-000000000003','staff-points@local-test.invalid',now(),'{"full_name":"Staff Test"}');
insert into public.annual_points_roster(user_id,valid_from,patrol_id,group_kind,scout_year) values
('b1000000-0000-4000-8000-000000000001','2026-11-01','a1000000-0000-4000-8000-000000000001','scout',1),
('b1000000-0000-4000-8000-000000000002','2026-11-01','a1000000-0000-4000-8000-000000000002','scout',4),
('b1000000-0000-4000-8000-000000000003','2026-11-01','a1000000-0000-4000-8000-000000000003','staff',null);
insert into public.user_roles(user_id,role) values ('b1000000-0000-4000-8000-000000000003','admin');
update public.annual_points_settings set enabled=true,starts_on='2026-11-01';
insert into public.annual_double_points_challenges(title,starts_on,ends_on,multiplier) values
('Week-end double','2026-11-07','2026-11-08',2),
('Second bonus chevauchant','2026-11-08','2026-11-09',3);
-- Use existing trigger semantics: a manual Strava link approved, photo pending.
insert into public.activities(user_id,ride_date,km,strava_link) values
('b1000000-0000-4000-8000-000000000001','2026-11-04',10,'https://www.strava.com/activities/910001'),
('b1000000-0000-4000-8000-000000000001','2026-11-08',10,'https://www.strava.com/activities/910002'),
('b1000000-0000-4000-8000-000000000002','2026-11-08',10,'https://www.strava.com/activities/910003'),
('b1000000-0000-4000-8000-000000000002','2026-10-28',10,'https://www.strava.com/activities/910004'),
('b1000000-0000-4000-8000-000000000003','2026-11-08',100,'https://www.strava.com/activities/910005');
insert into public.activities(user_id,ride_date,km,proof_path,status) values
('b1000000-0000-4000-8000-000000000001','2026-11-08',99,'synthetic-points-only.jpg','pending');
do $test$
begin
  if exists(select 1 from public.annual_patrol_points() where patrol_id='a1000000-0000-4000-8000-000000000003') then raise exception 'staff patrol in annual points'; end if;
  if exists(select 1 from chevaliers_private.annual_activity_points where user_id='b1000000-0000-4000-8000-000000000003') then raise exception 'staff activity yields points'; end if;
  if not exists(select 1 from public.annual_patrol_points() where patrol_id='a1000000-0000-4000-8000-000000000001' and km=20 and points=80) then raise exception 'young rate/overlap failed'; end if;
  if not exists(select 1 from public.annual_patrol_points() where patrol_id='a1000000-0000-4000-8000-000000000002' and km=10 and points=30) then raise exception 'senior/period failed'; end if;
end;
$test$;
set local role authenticated;
select set_config('request.jwt.claim.sub','b1000000-0000-4000-8000-000000000001',true);
select set_config('request.jwt.claims','{"sub":"b1000000-0000-4000-8000-000000000001","role":"authenticated"}',true);
do $test$
begin
  if not exists(select 1 from public.annual_my_points() where km=20 and points=80) then raise exception 'own points failed'; end if;
  if (select count(*) from public.annual_my_patrol_ranking()) <> 1 or not exists(select 1 from public.annual_my_patrol_ranking() where user_id=auth.uid() and km=20) then raise exception 'private patrol isolation failed'; end if;
  update public.annual_points_roster set scout_year=4 where user_id=auth.uid();
  if not exists(select 1 from public.annual_points_roster where user_id=auth.uid() and scout_year=1) then raise exception 'self modification of roster'; end if;
  begin
    insert into public.annual_double_points_challenges(title,starts_on,ends_on) values ('Forged bonus','2026-11-01','2027-03-21');
    raise exception 'scout created challenge';
  exception when insufficient_privilege then null;
  end;
end;
$test$;
reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub','b1000000-0000-4000-8000-000000000003',true);
select set_config('request.jwt.claims','{"sub":"b1000000-0000-4000-8000-000000000003","role":"authenticated"}',true);
do $test$
begin
  if not exists(select 1 from public.annual_my_patrol_ranking() where user_id=auth.uid() and km=100) then raise exception 'staff private ranking missing'; end if;
  if exists(select 1 from public.annual_my_patrol_ranking() where user_id in ('b1000000-0000-4000-8000-000000000001','b1000000-0000-4000-8000-000000000002')) then raise exception 'staff private ranking includes scouts'; end if;
end;
$test$;
reset role;
set local role anon;
select set_config('request.jwt.claim.sub','',true);
select set_config('request.jwt.claims','{"role":"anon"}',true);
do $test$
begin
  if has_function_privilege(current_user,'public.annual_my_patrol_ranking()','EXECUTE') then raise exception 'anon has private ranking access'; end if;
end;
$test$;
reset role;
rollback;
\echo 'ANNUAL_POINTS_CANDIDATE_OK'
