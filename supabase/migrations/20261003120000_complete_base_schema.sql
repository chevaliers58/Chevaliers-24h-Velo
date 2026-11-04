-- Complete the original application schema before the security and feature migrations.
-- These tables existed in the source Supabase project but were missing from its
-- migration history. Create the structures only; do not import source user data.

-- Columns used by the current application and security triggers.
alter table public.profiles
  add column if not exists is_admin boolean not null default false;

alter table public.activities
  add column if not exists gpx_path text;

-- Weekly badges are associated with auth.users (not profiles), as the admin UI expects.
create table if not exists public.weekly_badges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  badge_title text not null,
  awarded_date date not null default current_date,
  created_at timestamptz default now(),
  week_start date,
  category text,
  km numeric
);
alter table public.weekly_badges enable row level security;
grant select on public.weekly_badges to anon, authenticated;
grant insert, update, delete on public.weekly_badges to authenticated;
grant all on public.weekly_badges to service_role;

-- Countdown cards: public read, admin-managed by the policies in the next security migration.
create table if not exists public.countdowns (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subtitle text,
  target_date timestamptz not null,
  is_active boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.countdowns enable row level security;
grant select on public.countdowns to anon, authenticated;
grant insert, update, delete on public.countdowns to authenticated;
grant all on public.countdowns to service_role;
create index if not exists countdowns_active_target_date_idx
  on public.countdowns (target_date) where is_active;

-- Public expedition stages. The following feature migration adds the current
-- long-distance stages; no old database rows or member data are copied.
create table if not exists public.expedition_waypoints (
  id text primary key,
  name text not null,
  subtitle text not null default '',
  target_km integer not null default 0 check (target_km >= 0),
  description text not null default '',
  badge_name text not null default '',
  badge_emoji text not null default '',
  x integer not null default 0,
  y integer not null default 0
);
alter table public.expedition_waypoints enable row level security;
grant select on public.expedition_waypoints to anon, authenticated;
grant insert, update, delete on public.expedition_waypoints to authenticated;
grant all on public.expedition_waypoints to service_role;
create index if not exists expedition_waypoints_target_km_idx
  on public.expedition_waypoints (target_km);

-- GPX route proposals retained for compatibility with the original schema.
create table if not exists public.proposed_routes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  title text not null,
  description text,
  gpx_url text not null,
  created_at timestamptz not null default now()
);
alter table public.proposed_routes enable row level security;
grant select, insert, delete on public.proposed_routes to authenticated;
grant all on public.proposed_routes to service_role;
create index if not exists proposed_routes_created_at_idx
  on public.proposed_routes (created_at desc);

-- Public historical timeline. Content is intentionally left empty for the new
-- troupe; administrators can add the entries they want to publish.
create table if not exists public.timeline (
  id uuid primary key default gen_random_uuid(),
  year integer not null default extract(year from current_date)::integer,
  date_str text not null,
  title text not null,
  description text,
  image_url text,
  drive_url text,
  tag text not null default 'Événement',
  created_at timestamptz not null default now()
);
alter table public.timeline enable row level security;
grant select on public.timeline to anon, authenticated;
grant insert, update, delete on public.timeline to authenticated;
grant all on public.timeline to service_role;

create policy "timeline read public"
  on public.timeline for select to anon, authenticated
  using (true);
create policy "timeline manage admin"
  on public.timeline for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

create index if not exists timeline_year_date_idx
  on public.timeline (year desc, date_str desc);

-- Rejection workflow: the admin UI removes the rejected row after it has
-- captured the proof/GPX paths so it can delete the associated Storage files.
create or replace function public.delete_rejected_activity()
returns trigger
language plpgsql
security definer
set search_path = public
as $function$
begin
  if new.status = 'rejected' then
    delete from public.activities where id = new.id;
    return null;
  end if;
  return new;
end;
$function$;

drop trigger if exists trg_delete_rejected_activity on public.activities;
create trigger trg_delete_rejected_activity
  after update of status on public.activities
  for each row
  when (new.status = 'rejected')
  execute function public.delete_rejected_activity();
