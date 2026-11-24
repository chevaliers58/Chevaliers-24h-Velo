\set ON_ERROR_STOP on
begin;
insert into auth.users(id,email,email_confirmed_at,raw_user_meta_data)
values ('e1000000-0000-4000-8000-000000000001','season-test@local-test.invalid',now(),'{"full_name":"Season Test"}');
do $test$
declare
  today date := (now() at time zone 'Europe/Brussels')::date;
  uid uuid := 'e1000000-0000-4000-8000-000000000001';
begin
  update public.annual_points_settings set enabled=false;
  begin
    insert into public.activities(user_id,ride_date,km,strava_link) values(uid,today,8,'https://www.strava.com/activities/9999001');
    raise exception 'season not open but insert succeeded';
  exception when check_violation then
    if sqlerrm not like 'saison_chevaliers:%' then raise; end if;
  end;
  update public.annual_points_settings set starts_on=today-1,ends_on=today+1,enabled=true;
  begin
    insert into public.activities(user_id,ride_date,km,strava_link) values(uid,today-2,8,'https://www.strava.com/activities/9999002');
    raise exception 'pre-season insert succeeded';
  exception when check_violation then
    if sqlerrm not like 'saison_chevaliers:%' then raise; end if;
  end;
  begin
    insert into public.group_rides(created_by,ride_date,sport) values(uid,today+1,'velo');
    raise exception 'future group insert succeeded';
  exception when check_violation then
    if sqlerrm not like 'saison_chevaliers:%' then raise; end if;
  end;
  insert into public.activities(user_id,ride_date,km,strava_link) values(uid,today,8,'https://www.strava.com/activities/9999003');
  begin
    update public.activities set ride_date=today+2 where user_id=uid;
    raise exception 'out of season correction succeeded';
  exception when check_violation then
    if sqlerrm not like 'saison_chevaliers:%' then raise; end if;
  end;
  begin
    update public.annual_points_settings set starts_on=today+1,ends_on=today+3;
    raise exception 'season moved past existing activities';
  exception when check_violation then
    if sqlerrm not like 'saison_chevaliers:%' then raise; end if;
  end;
end;
$test$;
rollback;
\echo 'OFFICIAL_SEASON_GATE_OK'
