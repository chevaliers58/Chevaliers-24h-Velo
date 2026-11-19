-- Candidate only: both historical and current external-group names remain collective-only.
-- No patrol data is renamed or deleted.
create or replace function public.set_member_approval(_user_id uuid,_approved boolean) returns void
language plpgsql security definer set search_path='' as $$
begin
  if not public.member_access() or not public.has_role(auth.uid(),'admin') then
    raise exception 'Interdit';
  end if;
  update public.profiles set member_approved=_approved where id=_user_id;
  if not found then raise exception 'Compte introuvable'; end if;
  -- Approval attests the proposed affiliation. Start the official roster at season
  -- start; administrators may later enter a dated correction in the roster UI.
  if _approved then
    insert into public.annual_points_roster(user_id,valid_from,patrol_id,group_kind,scout_year)
    select p.id, coalesce(s.starts_on,(now() at time zone 'Europe/Brussels')::date),pt.id,
      case when p.is_admin or pt.category='staff' then 'staff'
           when lower(btrim(pt.name)) in ('autres membres de l''unité','externes') then 'other'
           else 'scout' end,
      case when not p.is_admin and pt.category<>'staff'
                and lower(btrim(pt.name)) not in ('autres membres de l''unité','externes')
           then p.scout_year end
    from public.profiles p join public.patrols pt on pt.id=p.patrol_id
    cross join public.annual_points_settings s
    where p.id=_user_id and s.singleton
      and (p.is_admin or pt.category='staff' or lower(btrim(pt.name)) in ('autres membres de l''unité','externes')
           or p.scout_year between 1 and 4)
    on conflict(user_id,valid_from) do nothing;
  end if;
end;
$$;
revoke all on function public.set_member_approval(uuid,boolean) from public,anon,authenticated;
grant execute on function public.set_member_approval(uuid,boolean) to authenticated;


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
where p.member_approved and not (coalesce(p.is_admin,false) or coalesce(pt.category='staff',false) or coalesce(lower(pt.name) like '%staff%' or lower(pt.name) like '%chef%',false) or lower(btrim(coalesce(pt.name,''))) in ('autres membres de l''unité','externes'));

-- The collective projection contains no participant ID, original ride ID, creation
-- time, elevation, note, GPX, photo or group ID. Group by day, patrol and sport
-- to retain week/month filters and distance milestones.
create or replace function public.staff_collective_distances(_from date default null,_to date default null)
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
    and p.member_approved and (coalesce(p.is_admin,false) or coalesce(pt.category='staff',false) or coalesce(lower(pt.name) like '%staff%' or lower(pt.name) like '%chef%',false) or lower(btrim(coalesce(pt.name,''))) in ('autres membres de l''unité','externes'))
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
  where p.member_approved and not (coalesce(p.is_admin,false) or coalesce(pa.category='staff',false) or coalesce(lower(pa.name) like '%staff%' or lower(pa.name) like '%chef%',false) or lower(btrim(coalesce(pa.name,''))) in ('autres membres de l''unité','externes'))
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
    and p.member_approved and not (coalesce(p.is_admin,false) or coalesce(pt.category='staff',false) or coalesce(lower(pt.name) like '%staff%' or lower(pt.name) like '%chef%',false) or lower(btrim(coalesce(pt.name,''))) in ('autres membres de l''unité','externes'))
  group by p.id,p.totem,p.full_name,pt.name order by 4 desc,5 desc,2;
$$;
revoke all on function public.scout_challenge_leaderboard() from public,anon,authenticated;
grant execute on function public.scout_challenge_leaderboard() to anon,authenticated,service_role;

create or replace view chevaliers_private.annual_activity_points as
select a.id as activity_id,a.user_id,r.patrol_id,a.ride_date,a.km,
       case when r.group_kind='scout' and r.scout_year in (1,2) then 2
            when r.group_kind='scout' then 1
            else s.other_rate end as base_rate,
       coalesce((select max(c.multiplier) from public.annual_double_points_challenges c
                 where c.enabled and a.ride_date between c.starts_on and c.ends_on),1) as multiplier,
       case when a.group_ride_id is null then 1 else
         least(2::numeric, greatest(1::numeric, 1 + 0.2 * ((select count(distinct g.user_id)
           from public.activities g where g.group_ride_id=a.group_ride_id and g.status='approved') - 2)))
       end as group_multiplier
from public.activities a
join public.annual_points_settings s on s.singleton and s.enabled
  and a.ride_date between s.starts_on and s.ends_on
cross join lateral (
  select x.patrol_id,x.group_kind,x.scout_year
  from public.annual_points_roster x
  where x.user_id=a.user_id and x.valid_from<=a.ride_date
  order by x.valid_from desc limit 1
) r
where a.status='approved' and r.group_kind='scout'
  and exists(select 1 from public.profiles p left join public.patrols pt on pt.id=p.patrol_id
    where p.id=a.user_id and p.member_approved and not (coalesce(p.is_admin,false) or coalesce(pt.category='staff',false) or coalesce(lower(pt.name) like '%staff%' or lower(pt.name) like '%chef%',false) or lower(btrim(coalesce(pt.name,''))) in ('autres membres de l''unité','externes')))
  and exists(select 1 from public.patrols rp where rp.id=r.patrol_id and rp.category <> 'staff'
    and not (lower(btrim(coalesce(rp.name,''))) in ('autres membres de l''unité','externes')));

-- Numeric arithmetic: no per-activity rounding; only presentation rounds.
create or replace function public.annual_patrol_points(_from date default null,_to date default null)
returns table(patrol_id uuid, patrol_name text, km numeric, points numeric)
language sql stable security definer set search_path='' as $$
  select p.id,p.name, coalesce(sum(a.km),0),coalesce(sum(a.km*a.base_rate*a.multiplier*a.group_multiplier),0)
  from public.patrols p left join chevaliers_private.annual_activity_points a
    on a.patrol_id=p.id and (_from is null or a.ride_date>=_from) and (_to is null or a.ride_date<=_to)
  where p.category <> 'staff' and not (lower(btrim(coalesce(p.name,''))) in ('autres membres de l''unité','externes'))
  group by p.id,p.name order by 4 desc,p.name;
$$;
revoke all on function public.annual_patrol_points(date,date) from public,anon,authenticated;
grant execute on function public.annual_patrol_points(date,date) to anon,authenticated,service_role;

create or replace function public.annual_my_points(_from date default null,_to date default null)
returns table(km numeric,points numeric)
language sql stable security definer set search_path='' as $$
  select coalesce(sum(a.km),0),coalesce(sum(a.km*a.base_rate*a.multiplier*a.group_multiplier),0)
  from chevaliers_private.annual_activity_points a
  where public.member_access() and a.user_id=auth.uid() and (_from is null or a.ride_date>=_from) and (_to is null or a.ride_date<=_to);
$$;
revoke all on function public.annual_my_points(date,date) from public,anon,authenticated;
grant execute on function public.annual_my_points(date,date) to authenticated,service_role;

-- The combined staff/other individual ranking is private to verified admins.
create or replace function public.annual_my_patrol_ranking()
returns table(user_id uuid,display_name text,km numeric)
language sql stable security definer set search_path='' as $$
  with caller as (
    select auth.uid() as uid, public.has_role(auth.uid(),'admin') as staff,
      (select r.patrol_id from public.annual_points_roster r
       where r.user_id=auth.uid() and r.group_kind='scout'
         and r.valid_from <= (now() at time zone 'Europe/Brussels')::date
       order by r.valid_from desc limit 1) as patrol
    where public.member_access()
  ), current_roster as (
    select distinct on (r.user_id) r.user_id,r.patrol_id,r.group_kind
    from public.annual_points_roster r
    where r.valid_from <= (now() at time zone 'Europe/Brussels')::date
    order by r.user_id,r.valid_from desc
  )
  select p.id,coalesce(nullif(btrim(concat_ws(' ',p.totem,p.quali)),''),nullif(p.full_name,''),'Scout'),
    coalesce(sum(a.km),0)
  from caller c cross join public.profiles p
  left join public.patrols pt on pt.id=p.patrol_id
  left join public.activities a on a.user_id=p.id and a.status='approved'
  where p.member_approved and ((c.staff and (coalesce(p.is_admin,false) or coalesce(pt.category='staff',false) or coalesce(lower(pt.name) like '%staff%' or lower(pt.name) like '%chef%',false) or lower(btrim(coalesce(pt.name,''))) in ('autres membres de l''unité','externes')))
    or (not c.staff and c.patrol is not null and not (coalesce(p.is_admin,false) or coalesce(pt.category='staff',false) or coalesce(lower(pt.name) like '%staff%' or lower(pt.name) like '%chef%',false) or lower(btrim(coalesce(pt.name,''))) in ('autres membres de l''unité','externes'))
    and exists(select 1 from current_roster r where r.user_id=p.id and r.patrol_id=c.patrol and r.group_kind='scout')))
  group by p.id,p.totem,p.quali,p.full_name order by 3 desc,2,p.id;
$$;

