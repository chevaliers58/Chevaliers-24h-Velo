\set ON_ERROR_STOP on
do $test$
begin
  if (select count(*) from public.patrols where name in ('Pumas','Guépards','Ocelots','Jaguars','Autres membres de l''unité')) <> 5 then
    raise exception 'missing patrols';
  end if;
  if not exists(select 1 from public.expedition_waypoints where id='terre-lune' and target_km=384400) then
    raise exception 'missing moon goal';
  end if;
  if not exists(select 1 from public.expedition_waypoints where id='marathon' and target_km=43) then
    raise exception 'missing marathon';
  end if;
end;
$test$;
begin;
insert into public.timeline_distance_milestone_overrides(milestone_km,title) values (43,'Test only');
rollback;
\echo 'PERSONALIZATION_CANDIDATE_OK'
