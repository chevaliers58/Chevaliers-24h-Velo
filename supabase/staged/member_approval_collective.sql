-- Launch candidate: staff approval is separate from confirmed email and from admin role.
-- New accounts start pending; existing verified administrators retain access.
alter table public.profiles add column member_approved boolean not null default false;
update public.profiles p set member_approved=true
where exists(select 1 from public.user_roles r where r.user_id=p.id and r.role='admin')
  and exists(select 1 from auth.users u where u.id=p.id and u.email_confirmed_at is not null);

create function public.member_access() returns boolean
language sql stable security definer set search_path='' as $$
  select exists(select 1 from public.profiles p join auth.users u on u.id=p.id
    where p.id=auth.uid() and p.member_approved and u.email_confirmed_at is not null);
$$;
revoke all on function public.member_access() from public,anon,authenticated;
grant execute on function public.member_access() to anon,authenticated,service_role;

create function chevaliers_private.guard_membership() returns trigger
language plpgsql security definer set search_path='' as $$
begin
  if tg_op='INSERT' then
    new.member_approved := false;
  elsif auth.uid() is not null and not public.has_role(auth.uid(),'admin') then
    new.member_approved := old.member_approved;
    if old.member_approved and (new.patrol_id is distinct from old.patrol_id
      or new.scout_year is distinct from old.scout_year) then
      raise exception 'Les affectations sont validées par le staff';
    end if;
  end if;
  if new.member_approved and not exists(select 1 from auth.users u
      where u.id=new.id and u.email_confirmed_at is not null) then
    raise exception 'Adresse e-mail non confirmée';
  end if;
  if tg_op='UPDATE' and old.member_approved and not new.member_approved
    and exists(select 1 from public.user_roles r where r.user_id=new.id and r.role='admin') then
    raise exception 'Retirer les droits admin avant de suspendre le compte';
  end if;
  return new;
end;
$$;
revoke all on function chevaliers_private.guard_membership() from public,anon,authenticated;
create trigger chevaliers_member_guard before insert or update on public.profiles
for each row execute function chevaliers_private.guard_membership();

create function public.set_member_approval(_user_id uuid,_approved boolean) returns void
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
           when lower(btrim(pt.name))='autres membres de l''unité' then 'other'
           else 'scout' end,
      case when not p.is_admin and pt.category<>'staff'
                and lower(btrim(pt.name))<>'autres membres de l''unité'
           then p.scout_year end
    from public.profiles p join public.patrols pt on pt.id=p.patrol_id
    cross join public.annual_points_settings s
    where p.id=_user_id and s.singleton
      and (p.is_admin or pt.category='staff' or lower(btrim(pt.name))='autres membres de l''unité'
           or p.scout_year between 1 and 4)
    on conflict(user_id,valid_from) do nothing;
  end if;
end;
$$;
revoke all on function public.set_member_approval(uuid,boolean) from public,anon,authenticated;
grant execute on function public.set_member_approval(uuid,boolean) to authenticated;

-- Members-only data remains inaccessible to merely authenticated pending accounts.
do $gate$
declare t text;
begin
  foreach t in array array['activities','activity_corrections','annual_points_roster',
    'app_notifications','group_ride_members','group_rides','member_links',
    'planned_ride_responses','planned_rides','proposed_routes',
    'scout_challenge_participants','scout_challenges','app_installations','app_push_subscriptions']
  loop
    execute format('create policy chevaliers_approved_member on public.%I as restrictive for all to authenticated using ((select public.member_access())) with check ((select public.member_access()))',t);
  end loop;
end;
$gate$;
create policy chevaliers_approved_proof_access on storage.objects as restrictive for all to authenticated
using (bucket_id <> 'proofs' or (select public.member_access()))
with check (bucket_id <> 'proofs' or (select public.member_access()));
create policy chevaliers_admin_target_approved on public.user_roles as restrictive for insert to authenticated
with check (role<>'admin' or ((select public.member_access()) and exists(
  select 1 from public.profiles p where p.id=user_id and p.member_approved)));

-- Pending viewers see only the anonymous projection. Pending profiles are not listed.
create or replace function public.public_display_name(_full_name text) returns text
language sql stable set search_path='' as $$
  select case when _full_name is null or btrim(_full_name)='' then null
    when public.member_access() then _full_name
    else split_part(btrim(_full_name),' ',1)||' '||
      case when split_part(btrim(_full_name),' ',2)<>'' then upper(left(split_part(btrim(_full_name),' ',2),1))||'.' else '' end
    end;
$$;
create or replace view public.profiles_public as
select p.id,case when nullif(btrim(p.totem),'') is null then public.public_display_name(p.full_name) else null::text end as full_name,
  p.totem,p.quali,p.scout_year,p.patrol_id,p.is_admin,
  case when public.member_access() then p.strava_url else null::text end as strava_url,p.created_at
from public.profiles p where p.member_approved;

-- The other-unit group is collective-only, not an administrator role or scout-points patrol.
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
where p.member_approved and not (coalesce(p.is_admin,false) or coalesce(pt.category='staff',false) or coalesce(lower(pt.name) like '%staff%' or lower(pt.name) like '%chef%',false) or lower(btrim(coalesce(pt.name,''))) = 'autres membres de l''unité');

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
    and p.member_approved and (coalesce(p.is_admin,false) or coalesce(pt.category='staff',false) or coalesce(lower(pt.name) like '%staff%' or lower(pt.name) like '%chef%',false) or lower(btrim(coalesce(pt.name,''))) = 'autres membres de l''unité')
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
  where p.member_approved and not (coalesce(p.is_admin,false) or coalesce(pa.category='staff',false) or coalesce(lower(pa.name) like '%staff%' or lower(pa.name) like '%chef%',false) or lower(btrim(coalesce(pa.name,''))) = 'autres membres de l''unité')
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
    and p.member_approved and not (coalesce(p.is_admin,false) or coalesce(pt.category='staff',false) or coalesce(lower(pt.name) like '%staff%' or lower(pt.name) like '%chef%',false) or lower(btrim(coalesce(pt.name,''))) = 'autres membres de l''unité')
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
    where p.id=a.user_id and p.member_approved and not (coalesce(p.is_admin,false) or coalesce(pt.category='staff',false) or coalesce(lower(pt.name) like '%staff%' or lower(pt.name) like '%chef%',false) or lower(btrim(coalesce(pt.name,''))) = 'autres membres de l''unité'))
  and exists(select 1 from public.patrols rp where rp.id=r.patrol_id and rp.category <> 'staff'
    and not (lower(btrim(coalesce(rp.name,''))) = 'autres membres de l''unité'));

-- Numeric arithmetic: no per-activity rounding; only presentation rounds.
create or replace function public.annual_patrol_points(_from date default null,_to date default null)
returns table(patrol_id uuid, patrol_name text, km numeric, points numeric)
language sql stable security definer set search_path='' as $$
  select p.id,p.name, coalesce(sum(a.km),0),coalesce(sum(a.km*a.base_rate*a.multiplier*a.group_multiplier),0)
  from public.patrols p left join chevaliers_private.annual_activity_points a
    on a.patrol_id=p.id and (_from is null or a.ride_date>=_from) and (_to is null or a.ride_date<=_to)
  where p.category <> 'staff' and not (lower(btrim(coalesce(p.name,''))) = 'autres membres de l''unité')
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
  where p.member_approved and ((c.staff and (coalesce(p.is_admin,false) or coalesce(pt.category='staff',false) or coalesce(lower(pt.name) like '%staff%' or lower(pt.name) like '%chef%',false) or lower(btrim(coalesce(pt.name,''))) = 'autres membres de l''unité'))
    or (not c.staff and c.patrol is not null and not (coalesce(p.is_admin,false) or coalesce(pt.category='staff',false) or coalesce(lower(pt.name) like '%staff%' or lower(pt.name) like '%chef%',false) or lower(btrim(coalesce(pt.name,''))) = 'autres membres de l''unité')
    and exists(select 1 from current_roster r where r.user_id=p.id and r.patrol_id=c.patrol and r.group_kind='scout')))
  group by p.id,p.totem,p.quali,p.full_name order by 3 desc,2,p.id;
$$;
CREATE OR REPLACE FUNCTION public.can_read_scout_challenge(_challenge_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select public.member_access() and exists (
    select 1 from public.scout_challenges c
    where c.id = _challenge_id and (
      c.challenger_id = auth.uid()
      or exists (select 1 from public.scout_challenge_participants p where p.challenge_id = c.id and p.user_id = auth.uid())
    )
  );
$function$
;
CREATE OR REPLACE FUNCTION public.create_scout_challenge(_title text, _description text, _proposed_points integer, _sport text, _target_km numeric, _exact_distance boolean, _target_elevation integer, _gpx_template_path text, _participant_ids uuid[])
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_user uuid := auth.uid();
  v_id uuid;
begin
  if not public.member_access() then raise exception 'Connexion requise'; end if;
  if char_length(trim(coalesce(_title,''))) not between 3 and 120 then raise exception 'Titre invalide'; end if;
  if _proposed_points not between 1 and 1000 then raise exception 'Points invalides'; end if;
  if _sport not in ('velo','course','marche') then raise exception 'Type d’activité invalide'; end if;
  if coalesce(cardinality(_participant_ids),0) not between 1 and 50
     or v_user = any(_participant_ids)
     or cardinality(_participant_ids) <> (select count(distinct x) from unnest(_participant_ids) x) then
    raise exception 'Sélectionne entre 1 et 50 scouts différents';
  end if;
  if exists(select 1 from unnest(_participant_ids) x where not exists(
    select 1 from public.profiles p where p.id=x and p.member_approved)) then
    raise exception 'Participants non validés';
  end if;
  if _gpx_template_path is not null then
    if _target_km is not null or _target_elevation is not null or coalesce(_exact_distance,false)
       or left(_gpx_template_path, length(v_user::text || '_challenge_')) <> (v_user::text || '_challenge_')
       or right(_gpx_template_path, 4) <> '.gpx' then
      raise exception 'Défi GPX invalide';
    end if;
  elsif (_target_km is null and _target_elevation is null and nullif(trim(coalesce(_description,'')), '') is null)
     or (_target_km is not null and (_target_km <= 0 or _target_km > 1000))
     or (_target_elevation is not null and (_target_elevation <= 0 or _target_elevation > 20000))
     or (_target_km is null and coalesce(_exact_distance,false)) then
    raise exception 'Le défi doit demander une distance, un D+ ou les deux';
  end if;

  insert into public.scout_challenges(challenger_id, challenged_id, title, description, proposed_points, status,
    sport, target_km, exact_distance, target_elevation, gpx_template_path, manual_validation, route_validation)
  values (v_user, null, trim(_title), nullif(trim(coalesce(_description,'')),''), _proposed_points, 'open',
    _sport, _target_km, coalesce(_exact_distance,false), _target_elevation, _gpx_template_path,
    _gpx_template_path is not null or (_target_km is null and _target_elevation is null),
    _gpx_template_path is null and _target_km is null and _target_elevation is null)
  returning id into v_id;

  insert into public.scout_challenge_participants(challenge_id, user_id)
  select v_id, x from unnest(_participant_ids) x;
  return v_id;
end;
$function$
;
CREATE OR REPLACE FUNCTION public.staff_birthday_dates()
 RETURNS TABLE(birth_day smallint, birth_month smallint)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select distinct p.birth_day, p.birth_month
  from public.profiles p
  join public.patrols pa on pa.id = p.patrol_id
  where public.member_access()
    and p.member_approved and p.birth_day is not null
    and p.birth_month is not null
    and lower(btrim(pa.name)) in ('staff troupe', 'staff');
$function$
;
CREATE OR REPLACE FUNCTION public.upcoming_birthdays(_days integer DEFAULT 7)
 RETURNS TABLE(user_id uuid, display_name text, patrol_name text, birth_day smallint, birth_month smallint, days_until integer)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  with today as (
    select (now() at time zone 'Europe/Brussels')::date as d
  ),
  prochains as (
    select p.id, p.totem, p.quali, p.full_name, p.patrol_id, p.birth_day, p.birth_month,
           -- prochaine date d'anniversaire (cette année ou l'an prochain)
           (select min(x) from (
              select make_date(y,
                               p.birth_month::int,
                               least(p.birth_day::int,
                                     extract(day from (make_date(y, p.birth_month::int, 1)
                                                       + interval '1 month - 1 day'))::int)) as x
              from (select extract(year from t.d)::int as y
                    union all select extract(year from t.d)::int + 1) ys
            ) c where x >= t.d) as next_date,
           t.d as today
    from public.profiles p, today t
    where p.member_approved and p.birth_day is not null and p.birth_month is not null
  )
  select pr.id,
         coalesce(nullif(btrim(concat_ws(' ', pr.totem, pr.quali)), ''), pr.full_name, 'Scout'),
         pa.name,
         pr.birth_day,
         pr.birth_month,
         (pr.next_date - pr.today)::int
  from prochains pr
  left join public.patrols pa on pa.id = pr.patrol_id
  where public.member_access()
    and pr.next_date - pr.today between 0 and least(greatest(coalesce(_days, 7), 0), 31)
  order by 6, 2;
$function$
;
CREATE OR REPLACE FUNCTION public.set_admin_by_email(_email text, _make_admin boolean)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare uid uuid;
begin
  if not public.has_role(auth.uid(), 'admin') then raise exception 'Interdit'; end if;
  select id into uid
    from auth.users
   where lower(email) = lower(btrim(_email))
     and email_confirmed_at is not null
     and exists(select 1 from public.profiles p where p.id=auth.users.id and p.member_approved);
  if uid is null then
    raise exception 'Aucun compte avec cet email (la personne doit d''abord se connecter une fois)';
  end if;
  if _make_admin then
    insert into public.user_roles(user_id, role) values (uid, 'admin') on conflict do nothing;
  else
    if uid = auth.uid() then
      raise exception 'Impossible de retirer ses propres droits administrateur';
    end if;
    delete from public.user_roles where user_id = uid and role = 'admin';
  end if;
end; $function$
;
