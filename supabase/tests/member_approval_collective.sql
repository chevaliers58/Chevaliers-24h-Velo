-- New release regressions. Run only after all staged migrations in disposable CI.
\set ON_ERROR_STOP on
begin;
insert into auth.users(id,email,email_confirmed_at,raw_user_meta_data) values
('e5000000-0000-4000-8000-000000000001','launch-admin@local-test.invalid',now(),'{"full_name":"Launch Admin"}'),
('e5000000-0000-4000-8000-000000000002','launch-pending@local-test.invalid',now(),'{"full_name":"Pending Scout"}'),
('e5000000-0000-4000-8000-000000000003','launch-other@local-test.invalid',now(),'{"full_name":"Other Member"}'),
('e5000000-0000-4000-8000-000000000004','launch-unconfirmed@local-test.invalid',null,'{"full_name":"Unconfirmed User"}');
update public.profiles set patrol_id=(select id from public.patrols where name='Pumas'),scout_year=2
where id='e5000000-0000-4000-8000-000000000002';
update public.profiles set patrol_id=(select id from public.patrols where name='Autres membres de l''unité')
where id='e5000000-0000-4000-8000-000000000003';
update public.profiles set member_approved=true where id='e5000000-0000-4000-8000-000000000001';
insert into public.user_roles(user_id,role) values ('e5000000-0000-4000-8000-000000000001','admin');
update public.annual_points_settings set starts_on='2026-09-27',ends_on='2099-12-31',enabled=true;
insert into public.member_links(key,url) values ('whatsapp_sorties','https://chat.whatsapp.com/SyntheticOnly')
on conflict(key) do update set url=excluded.url;
insert into public.planned_rides(created_by,title,ride_date,start_time,meeting_point)
values ('e5000000-0000-4000-8000-000000000001','Synthetic ride',current_date+1,'10:00','Synthetic location');
set local role authenticated;
select set_config('request.jwt.claim.sub','e5000000-0000-4000-8000-000000000002',true);
select set_config('request.jwt.claims','{"sub":"e5000000-0000-4000-8000-000000000002","role":"authenticated"}',true);
do $test$
begin
  if public.member_access() then raise exception 'Pending user is approved'; end if;
  update public.profiles set member_approved=true where id=auth.uid();
  if public.member_access() then raise exception 'Self approval succeeded'; end if;
  if exists(select 1 from public.member_links) or exists(select 1 from public.planned_rides)
     or exists(select 1 from public.group_ride_members) or exists(select 1 from public.upcoming_birthdays(31))
     or exists(select 1 from public.annual_my_patrol_ranking())
     or exists(select 1 from public.profiles_public where id=auth.uid()) then
    raise exception 'Pending account can see member data'; end if;
  if public.public_display_name('Example Scout') <> 'Example S.' then raise exception 'Pending viewer can read full names'; end if;
  begin
    perform public.set_member_approval(auth.uid(),true);
    raise exception 'Self approval RPC succeeded';
  exception when raise_exception then if sqlerrm <> 'Interdit' then raise; end if; end;
  begin
    insert into public.activities(user_id,ride_date,km,strava_link)
    values(auth.uid(),(now() at time zone 'Europe/Brussels')::date,10,'https://www.strava.com/activities/990001');
    raise exception 'Pending account can submit activity';
  exception when insufficient_privilege then null; end;
  begin
    insert into storage.objects(bucket_id,name) values('proofs','e5000000-0000-4000-8000-000000000002_pending.jpg');
    raise exception 'Pending account can upload proof';
  exception when insufficient_privilege then null; end;
  begin
    perform public.create_scout_challenge('Test challenge','Synthetic',10,'velo',10,false,null,null,
       array['e5000000-0000-4000-8000-000000000001'::uuid]);
    raise exception 'Pending account can create a challenge';
  exception when raise_exception then if sqlerrm <> 'Connexion requise' then raise; end if; end;
end;
$test$;
select set_config('request.jwt.claim.sub','e5000000-0000-4000-8000-000000000001',true);
select set_config('request.jwt.claims','{"sub":"e5000000-0000-4000-8000-000000000001","role":"authenticated"}',true);
do $test$
begin
  perform public.set_member_approval('e5000000-0000-4000-8000-000000000002',true);
  perform public.set_member_approval('e5000000-0000-4000-8000-000000000003',true);
  begin
    perform public.set_member_approval('e5000000-0000-4000-8000-000000000004',true);
    raise exception 'Unconfirmed email approved';
  exception when raise_exception then if sqlerrm <> 'Adresse e-mail non confirmée' then raise; end if; end;
end;
$test$;
select set_config('request.jwt.claim.sub','e5000000-0000-4000-8000-000000000002',true);
select set_config('request.jwt.claims','{"sub":"e5000000-0000-4000-8000-000000000002","role":"authenticated"}',true);
do $test$
begin
  if not public.member_access() or not exists(select 1 from public.member_links) or not exists(select 1 from public.planned_rides) then
    raise exception 'Approved member lacks access'; end if;
  if not exists(select 1 from public.annual_points_roster where user_id=auth.uid() and group_kind='scout' and scout_year=2) then
    raise exception 'Approval did not initialize verified roster'; end if;
  begin
    update public.profiles set patrol_id=(select id from public.patrols where name='Jaguars') where id=auth.uid();
    raise exception 'Approved member can change affiliation';
  exception when raise_exception then if sqlerrm <> 'Les affectations sont validées par le staff' then raise; end if; end;
end;
$test$;
reset role;
select set_config('request.jwt.claim.sub','',true);
select set_config('request.jwt.claims','{}',true);
insert into public.activities(user_id,ride_date,km,strava_link) values
('e5000000-0000-4000-8000-000000000002',(now() at time zone 'Europe/Brussels')::date,10,'https://www.strava.com/activities/990002'),
('e5000000-0000-4000-8000-000000000003',(now() at time zone 'Europe/Brussels')::date,20,'https://www.strava.com/activities/990003'),
('e5000000-0000-4000-8000-000000000001',(now() at time zone 'Europe/Brussels')::date,30,'https://www.strava.com/activities/990004');
set local role anon;
do $test$
begin
  if exists(select 1 from public.annual_patrol_points() where patrol_name='Autres membres de l''unité') then
    raise exception 'Other group present in points table'; end if;
  if not exists(select 1 from public.annual_patrol_points() where patrol_name='Pumas' and points=20) then
    raise exception 'Scout points missing or incorrect'; end if;
  if exists(select 1 from public.activities_public where user_id in
    ('e5000000-0000-4000-8000-000000000001','e5000000-0000-4000-8000-000000000003')) then
    raise exception 'Collective-only individual rows visible'; end if;
  if not exists(select 1 from public.staff_collective_distances() d join public.patrols p on p.id=d.patrol_id
      where p.name='Autres membres de l''unité' and d.km=20) then
    raise exception 'Other member collective kilometres missing'; end if;
  if exists(select 1 from public.leaderboard(null,null) where user_id='e5000000-0000-4000-8000-000000000003') then
    raise exception 'Other member visible in individual ranking'; end if;
end;
$test$;
reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub','e5000000-0000-4000-8000-000000000001',true);
select set_config('request.jwt.claims','{"sub":"e5000000-0000-4000-8000-000000000001","role":"authenticated"}',true);
do $test$
begin
  if not exists(select 1 from public.annual_my_patrol_ranking() where user_id='e5000000-0000-4000-8000-000000000003' and km=20) then
    raise exception 'Admin combined private ranking missing other group'; end if;
  perform public.set_member_approval('e5000000-0000-4000-8000-000000000002',false);
end;
$test$;
select set_config('request.jwt.claim.sub','e5000000-0000-4000-8000-000000000002',true);
select set_config('request.jwt.claims','{"sub":"e5000000-0000-4000-8000-000000000002","role":"authenticated"}',true);
do $test$
begin
  if public.member_access() or exists(select 1 from public.member_links) or exists(select 1 from public.activities) then
    raise exception 'Suspended user retains member access'; end if;
end;
$test$;
reset role;
rollback;
\echo 'MEMBER_APPROVAL_COLLECTIVE_OK'
