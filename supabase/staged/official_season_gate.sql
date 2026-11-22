-- Release gate: no genuine activity can be entered before staff activates the season.
-- Retain existing historical minimum constraints; no deletion or rewrites of activities.
revoke insert,delete on public.annual_points_settings from authenticated;

create function chevaliers_private.enforce_official_ride_date()
returns trigger language plpgsql security definer set search_path='' as $$
declare
  season public.annual_points_settings%rowtype;
begin
  if tg_op='UPDATE' and new.ride_date is not distinct from old.ride_date then
    return new;
  end if;
  -- Serialize date changes against season configuration without exposing write privileges.
  select * into season from public.annual_points_settings where singleton for share;
  if not found or not season.enabled or season.starts_on is null then
    raise exception 'saison_chevaliers: season not open' using errcode='23514';
  end if;
  if new.ride_date < season.starts_on or new.ride_date > season.ends_on
     or new.ride_date > (now() at time zone 'Europe/Brussels')::date then
    raise exception 'saison_chevaliers: date outside official season' using errcode='23514';
  end if;
  return new;
end;
$$;
revoke all on function chevaliers_private.enforce_official_ride_date() from public,anon,authenticated;

create trigger chevaliers_official_activity_date before insert or update of ride_date
on public.activities for each row execute function chevaliers_private.enforce_official_ride_date();
create trigger chevaliers_official_group_date before insert or update of ride_date
on public.group_rides for each row execute function chevaliers_private.enforce_official_ride_date();

create function chevaliers_private.check_season_bounds()
returns trigger language plpgsql security definer set search_path='' as $$
begin
  if new.enabled and (new.starts_on is null or new.starts_on < date '2026-09-27'
      or exists(select 1 from public.activities a where a.ride_date not between new.starts_on and new.ends_on)
      or exists(select 1 from public.group_rides g where g.ride_date not between new.starts_on and new.ends_on)) then
    raise exception 'saison_chevaliers: inconsistent season dates' using errcode='23514';
  end if;
  return new;
end;
$$;
revoke all on function chevaliers_private.check_season_bounds() from public,anon,authenticated;
create trigger chevaliers_season_bounds before update on public.annual_points_settings
for each row execute function chevaliers_private.check_season_bounds();
