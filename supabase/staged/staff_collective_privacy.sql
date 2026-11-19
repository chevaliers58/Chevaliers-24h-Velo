-- CANDIDATE: test on disposable database only. Requires client migration before live use.
-- Public individual projections must not expose a chef's ride identifiers or times.
-- Do not change the base activities table: own rides and staff validation retain access.
create or replace view public.activities_public as
select a.id,a.user_id,a.km,a.elevation_m,a.ride_date,a.created_at,a.status,
  case
    when lower(coalesce(a.note,'')) like '[course]%' or lower(coalesce(a.note,'')) like '%#course%' or lower(coalesce(a.note,'')) like '%#run%' then '[course]'::text
    when lower(coalesce(a.note,'')) like '[marche]%' or lower(coalesce(a.note,'')) like '%#marche%' then '[marche]'::text
    else null::text
  end as note,a.group_ride_id
from public.activities a
join public.profiles p on p.id=a.user_id
left join public.patrols pt on pt.id=p.patrol_id
where not (coalesce(p.is_admin,false) or coalesce(pt.category='staff',false)
           or coalesce(lower(pt.name) like '%staff%' or lower(pt.name) like '%chef%',false));

-- The collective projection contains no participant ID, original ride ID, creation
-- time, elevation, note, GPX, photo or group ID. Group by day, patrol and sport
-- to retain week/month filters and distance milestones.
create function public.staff_collective_distances(_from date default null,_to date default null)
returns table(patrol_id uuid,ride_date date,sport text,km numeric,rides bigint)
language sql stable security definer set search_path='' as $$
  select coalesce(p.patrol_id,
      (select s.id from public.patrols s where s.category='staff'
       and lower(btrim(s.name)) in ('staff troupe','staff')
       order by case when lower(btrim(s.name))='staff troupe' then 0 else 1 end,s.id limit 1)),
    a.ride_date,
    case
      when lower(coalesce(a.note,'')) like '[course]%' or lower(coalesce(a.note,'')) like '%#course%' or lower(coalesce(a.note,'')) like '%#run%' then 'course'
      when lower(coalesce(a.note,'')) like '[marche]%' or lower(coalesce(a.note,'')) like '%#marche%' then 'marche'
      else 'velo' end,
    sum(a.km),count(*)
  from public.activities a
  join public.profiles p on p.id=a.user_id
  left join public.patrols pt on pt.id=p.patrol_id
  where a.status='approved'
    and (coalesce(p.is_admin,false) or coalesce(pt.category='staff',false)
         or coalesce(lower(pt.name) like '%staff%' or lower(pt.name) like '%chef%',false))
    and (_from is null or a.ride_date>=_from)
    and (_to is null or a.ride_date<=_to)
  group by 1,2,3 order by 2,1,3;
$$;
revoke all on function public.staff_collective_distances(date,date) from public,anon,authenticated;
grant execute on function public.staff_collective_distances(date,date) to anon,authenticated,service_role;

-- Historical public ranking endpoints must also exclude staff, not only the UI.
create or replace function public.leaderboard(_from date,_to date)
returns table(user_id uuid,display_name text,patrol_id uuid,patrol_name text,category public.patrol_category,km numeric)
language sql stable security definer set search_path='' as $$
  select p.id,coalesce(nullif(p.totem,''),public.public_display_name(p.full_name),'Scout'),
    pa.id,coalesce(pa.name,'Sans patrouille'),
    coalesce(pa.category,'homme'::public.patrol_category),
    coalesce(sum(a.km) filter(where a.status='approved'
      and (_from is null or a.ride_date>=_from) and (_to is null or a.ride_date<=_to)),0)
  from public.profiles p
  left join public.patrols pa on pa.id=p.patrol_id
  left join public.activities a on a.user_id=p.id
  where not (coalesce(p.is_admin,false) or coalesce(pa.category='staff',false)
             or coalesce(lower(pa.name) like '%staff%' or lower(pa.name) like '%chef%',false))
  group by p.id,pa.id,pa.name,pa.category order by 6 desc,p.id;
$$;
revoke all on function public.leaderboard(date,date) from public,anon,authenticated;
grant execute on function public.leaderboard(date,date) to anon,authenticated,service_role;

create or replace function public.scout_challenge_leaderboard()
returns table(user_id uuid,display_name text,patrol_name text,points bigint,challenges_won bigint)
language sql stable security definer set search_path='' as $$
  select p.id,coalesce(nullif(p.totem,''),public.public_display_name(p.full_name),'Scout'),pt.name,
    sum(c.awarded_points)::bigint,count(*)::bigint
  from public.scout_challenges c
  join public.profiles p on p.id=c.winner_id
  left join public.patrols pt on pt.id=p.patrol_id
  where c.status='completed' and c.awarded_points>0
    and not (coalesce(p.is_admin,false) or coalesce(pt.category='staff',false)
             or coalesce(lower(pt.name) like '%staff%' or lower(pt.name) like '%chef%',false))
  group by p.id,p.totem,p.full_name,pt.name order by 4 desc,5 desc,2;
$$;
revoke all on function public.scout_challenge_leaderboard() from public,anon,authenticated;
grant execute on function public.scout_challenge_leaderboard() to anon,authenticated,service_role;
