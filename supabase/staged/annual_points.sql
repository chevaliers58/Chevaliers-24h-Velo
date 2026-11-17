-- Candidate: apply only in disposable CI for now. Do not run against the live project.
-- Official points are server-calculated and independent of kilometres.
create table public.annual_points_settings (
  singleton boolean primary key default true check (singleton),
  starts_on date,
  ends_on date not null default date '2027-03-21',
  enabled boolean not null default false,
  other_rate smallint not null default 1 check (other_rate in (0,1,2)),
  check (starts_on is null or starts_on <= ends_on),
  check (not enabled or starts_on is not null)
);
insert into public.annual_points_settings(singleton) values (true);

-- Dated staff-confirmed assignments; not editable by the account itself.
-- A later valid_from never moves the points from an earlier activity.
create table public.annual_points_roster (
  user_id uuid not null references public.profiles(id) on delete cascade,
  valid_from date not null,
  patrol_id uuid not null references public.patrols(id) on delete restrict,
  group_kind text not null check (group_kind in ('scout','staff','other')),
  scout_year smallint,
  primary key(user_id,valid_from),
  check ((group_kind='scout' and scout_year is not null and scout_year between 1 and 4)
       or (group_kind in ('staff','other') and scout_year is null))
);

create table public.annual_double_points_challenges (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(btrim(title)) between 3 and 120),
  description text not null default '' check (char_length(description)<=2000),
  starts_on date not null,
  ends_on date not null,
  enabled boolean not null default true,
  check (starts_on <= ends_on)
);

alter table public.annual_points_settings enable row level security;
alter table public.annual_points_roster enable row level security;
alter table public.annual_double_points_challenges enable row level security;
revoke all on public.annual_points_settings,public.annual_points_roster,public.annual_double_points_challenges from public,anon,authenticated;
grant select on public.annual_points_settings,public.annual_double_points_challenges to anon,authenticated;
grant select on public.annual_points_roster to authenticated;
grant insert,update,delete on public.annual_points_settings,public.annual_points_roster,public.annual_double_points_challenges to authenticated;
grant all on public.annual_points_settings,public.annual_points_roster,public.annual_double_points_challenges to service_role;
create policy annual_settings_read on public.annual_points_settings for select to anon,authenticated using (true);
create policy annual_settings_admin on public.annual_points_settings for all to authenticated
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create policy annual_roster_read on public.annual_points_roster for select to authenticated
  using (user_id=auth.uid() or public.has_role(auth.uid(),'admin'));
create policy annual_roster_admin on public.annual_points_roster for all to authenticated
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create policy annual_challenges_read on public.annual_double_points_challenges for select to anon,authenticated
  using (enabled);
create policy annual_challenges_admin on public.annual_double_points_challenges for all to authenticated
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

-- Internal view is not an exposed endpoint. Public functions below expose only
-- the requested summary. A missing confirmed roster entry never yields official points.
create schema if not exists chevaliers_private;
revoke all on schema chevaliers_private from public,anon,authenticated;
create view chevaliers_private.annual_activity_points as
select a.id as activity_id,a.user_id,r.patrol_id,a.ride_date,a.km,
       case when r.group_kind='scout' and r.scout_year in (1,2) then 2
            when r.group_kind='scout' then 1
            else s.other_rate end as base_rate,
       case when exists(select 1 from public.annual_double_points_challenges c
                        where c.enabled and a.ride_date between c.starts_on and c.ends_on)
            then 2 else 1 end as multiplier
from public.activities a
join public.annual_points_settings s on s.singleton and s.enabled
  and a.ride_date between s.starts_on and s.ends_on
cross join lateral (
  select x.patrol_id,x.group_kind,x.scout_year
  from public.annual_points_roster x
  where x.user_id=a.user_id and x.valid_from<=a.ride_date
  order by x.valid_from desc limit 1
) r
where a.status='approved' and r.group_kind <> 'staff';

-- Numeric arithmetic: no per-activity rounding; only presentation rounds.
create function public.annual_patrol_points(_from date default null,_to date default null)
returns table(patrol_id uuid, patrol_name text, km numeric, points numeric)
language sql stable security definer set search_path='' as $$
  select p.id,p.name, coalesce(sum(a.km),0),coalesce(sum(a.km*a.base_rate*a.multiplier),0)
  from public.patrols p left join chevaliers_private.annual_activity_points a
    on a.patrol_id=p.id and (_from is null or a.ride_date>=_from) and (_to is null or a.ride_date<=_to)
  where p.category <> 'staff'
  group by p.id,p.name order by 4 desc,p.name;
$$;
revoke all on function public.annual_patrol_points(date,date) from public,anon,authenticated;
grant execute on function public.annual_patrol_points(date,date) to anon,authenticated,service_role;

create function public.annual_my_points(_from date default null,_to date default null)
returns table(km numeric,points numeric)
language sql stable security definer set search_path='' as $$
  select coalesce(sum(a.km),0),coalesce(sum(a.km*a.base_rate*a.multiplier),0)
  from chevaliers_private.annual_activity_points a
  where a.user_id=auth.uid() and (_from is null or a.ride_date>=_from) and (_to is null or a.ride_date<=_to);
$$;
revoke all on function public.annual_my_points(date,date) from public,anon,authenticated;
grant execute on function public.annual_my_points(date,date) to authenticated,service_role;
