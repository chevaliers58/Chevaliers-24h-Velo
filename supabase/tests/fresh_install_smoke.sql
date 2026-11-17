-- Executed ONLY in the disposable local Supabase CI project.
-- All synthetic account rows are rolled back at the end.
\set ON_ERROR_STOP on
begin;

do $test$
declare
  table_name text;
begin
  foreach table_name in array array[
    'profiles','patrols','activities','user_roles','countdowns','timeline',
    'proposed_routes','group_rides','group_ride_members','planned_rides',
    'planned_ride_responses','member_links','weekly_badges','distance_awards',
    'scout_challenges','scout_challenge_participants','activity_corrections',
    'timeline_distance_milestone_overrides','app_notifications',
    'app_notification_settings','cleanup_runs','expedition_waypoints',
    'site_settings','solidarity_goals','strava_connections','strava_oauth_states',
    'app_push_subscriptions','app_installations'
  ] loop
    if not exists (
      select 1 from pg_class c join pg_namespace n on n.oid = c.relnamespace
       where n.nspname = 'public' and c.relname = table_name
         and c.relkind = 'r' and c.relrowsecurity
    ) then
      raise exception 'Missing table or disabled RLS: %', table_name;
    end if;
  end loop;
  if exists (select 1 from auth.users) or exists (select 1 from public.profiles)
     or exists (select 1 from public.activities) then
    raise exception 'Clean installation contains unexpected member data';
  end if;
  if not exists (select 1 from public.patrols where lower(name) = 'staff troupe' and category = 'staff') then
    raise exception 'Default Staff troupe missing';
  end if;
  if not exists (select 1 from storage.buckets where id = 'proofs' and public and file_size_limit = 15728640)
     or not exists (select 1 from storage.buckets where id = 'backgrounds' and public) then
    raise exception 'Expected original Storage behavior not installed';
  end if;
  if has_any_column_privilege('anon','public.strava_connections','SELECT')
     or has_any_column_privilege('authenticated','public.strava_connections','SELECT')
     or has_any_column_privilege('anon','public.strava_oauth_states','SELECT')
     or has_any_column_privilege('authenticated','public.strava_oauth_states','SELECT') then
    raise exception 'Private OAuth information accessible to browser roles';
  end if;
  if not has_function_privilege('authenticated','public.has_role(uuid,public.app_role)','EXECUTE') then
    raise exception 'RLS helper unavailable to authenticated users';
  end if;
  if has_function_privilege('anon','public.set_admin_by_email(text,boolean)','EXECUTE') then
    raise exception 'Anonymous admin assignment RPC available';
  end if;
end;
$test$;

insert into auth.users(id,email,email_confirmed_at,raw_user_meta_data) values
  ('11111111-1111-4111-8111-111111111111','admin@local-test.invalid',now(),'{"full_name":"Admin Local"}'),
  ('22222222-2222-4222-8222-222222222222','scout@local-test.invalid',now(),'{"full_name":"Scout Local"}');

insert into public.user_roles(user_id,role)
values ('11111111-1111-4111-8111-111111111111','admin');

set local role authenticated;
select set_config('request.jwt.claim.sub','22222222-2222-4222-8222-222222222222',true);
select set_config('request.jwt.claims','{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}',true);

do $test$
begin
  if public.has_role(auth.uid(),'admin') then
    raise exception 'New scout unexpectedly admin';
  end if;
  if (select count(*) from public.profiles) <> 1 then
    raise exception 'Scout can read other private profiles or cannot read own';
  end if;
  update public.profiles set is_admin = true where id = auth.uid();
  if exists(select 1 from public.profiles where id = auth.uid() and is_admin) then
    raise exception 'Scout can change admin flag';
  end if;
  begin
    insert into public.user_roles(user_id,role) values (auth.uid(),'admin');
    raise exception 'Scout can self-assign admin role';
  exception when insufficient_privilege then null;
  end;
  -- A photo submitted by a scout always waits for approval.
  insert into public.activities(id,user_id,ride_date,km,proof_path,status)
  values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2',auth.uid(),
          greatest(current_date,date '2026-09-27'),8,'local-photo.jpg','approved');
  if not exists (
    select 1 from public.activities
    where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2' and status = 'pending'
  ) then
    raise exception 'Scout photo can bypass validation';
  end if;
  begin
    insert into public.activities(user_id,ride_date,km,strava_link)
    values (auth.uid(),greatest(current_date,date '2026-09-27'),10,'https://example.invalid/activity');
    raise exception 'Invalid Strava link can bypass validation';
  exception when check_violation then null;
  end;
  begin
    insert into public.activities(user_id,ride_date,km)
    values (auth.uid(),greatest(current_date,date '2026-09-27'),10);
    raise exception 'Activity accepted without proof';
  exception when check_violation then null;
  end;
  -- A manual Strava link keeps the original auto-approval behavior.
  insert into public.activities(id,user_id,ride_date,km,strava_link)
  values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',auth.uid(),
          greatest(current_date,date '2026-09-27'),12,'https://www.strava.com/activities/123');
  if not exists (
    select 1 from public.activities
    where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1'
      and source = 'manual' and strava_activity_id is null and status = 'approved'
  ) then
    raise exception 'Manual Strava link no longer works';
  end if;
  begin
    insert into public.activities(user_id,ride_date,km,strava_link,source,strava_activity_id)
    values (auth.uid(),greatest(current_date,date '2026-09-27'),10,
            'https://www.strava.com/activities/456','strava',456);
    raise exception 'Scout can forge an automatic Strava import';
  exception when insufficient_privilege then null;
  end;
  begin
    update public.activities set source = 'strava', strava_activity_id = 123
    where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1';
    raise exception 'Scout can modify the Strava import provenance';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.set_admin_by_email('scout@local-test.invalid',true);
    raise exception 'Scout can call admin assignment';
  exception when raise_exception then
    if sqlerrm <> 'Interdit' then raise; end if;
  end;
end;
$test$;

reset role;
select set_config('request.jwt.claim.sub','',true);
select set_config('request.jwt.claims','{}',true);

-- The trusted service role can still import a verified activity.
set local role service_role;
select set_config('request.jwt.claims','{"role":"service_role"}',true);
insert into public.activities(user_id,ride_date,km,strava_link,source,strava_activity_id,status)
values ('22222222-2222-4222-8222-222222222222',
        greatest(current_date,date '2026-09-27'),9,
        'https://www.strava.com/activities/789','strava',789,'approved');
reset role;
select set_config('request.jwt.claims','{}',true);
do $test$
begin
  if not exists (
    select 1 from public.activities where strava_activity_id = 789
      and source = 'strava' and status = 'approved'
  ) then
    raise exception 'Trusted Strava import no longer works';
  end if;
end;
$test$;

-- A public profile email is member-editable. Admin assignment must resolve
-- the verified Auth email, not this display/profile field.
update public.profiles set email = 'unrelated@local-test.invalid'
where id = '22222222-2222-4222-8222-222222222222';

set local role authenticated;
select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',true);
select set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}',true);
do $test$
begin
  if not public.has_role(auth.uid(),'admin') then
    raise exception 'Bootstrap admin role missing';
  end if;
  -- The existing admin UI submits its own photo activities as approved.
  insert into public.activities(id,user_id,ride_date,km,proof_path,status)
  values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3',auth.uid(),
          greatest(current_date,date '2026-09-27'),7,'local-admin-photo.jpg','approved');
  if not exists (
    select 1 from public.activities
    where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3' and status = 'approved'
  ) then
    raise exception 'Admin photo validation disagrees with the original form';
  end if;
  perform public.set_admin_by_email('scout@local-test.invalid',true);
  if not exists(select 1 from public.user_roles where user_id = '22222222-2222-4222-8222-222222222222' and role = 'admin') then
    raise exception 'Admin assignment did not use verified Auth email';
  end if;
  perform public.set_admin_by_email('scout@local-test.invalid',false);
  delete from public.user_roles where user_id = auth.uid() and role = 'admin';
  if not public.has_role(auth.uid(),'admin') then
    raise exception 'Administrator can accidentally remove own admin role';
  end if;
end;
$test$;

reset role;
select set_config('request.jwt.claim.sub','',true);
select set_config('request.jwt.claims','{}',true);
set local role anon;

do $test$
begin
  if (select count(*) from public.profiles_public) <> 2 then
    raise exception 'Public ranking profile view unavailable';
  end if;
  begin
    if (select count(*) from public.profiles) <> 0 then
      raise exception 'Anonymous user can read private profiles';
    end if;
  exception when insufficient_privilege then null;
  end;
  if exists(select 1 from public.profiles_public where strava_url is not null) then
    raise exception 'Public profile view exposes Strava profile links';
  end if;
end;
$test$;

reset role;
rollback;
\echo 'Clean database smoke tests passed'
