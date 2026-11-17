-- Prépare l'association OAuth Strava et rend les imports d'activités idempotents.
-- Les jetons et états OAuth ne sont jamais accessibles aux rôles du navigateur.

alter table public.activities
  add column if not exists source text not null default 'manual',
  add column if not exists strava_activity_id bigint;

do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'activities_source_check'
      and conrelid = 'public.activities'::regclass
  ) then
    alter table public.activities
      add constraint activities_source_check check (source in ('manual', 'strava'));
  end if;
end $$;

create unique index if not exists activities_strava_activity_id_unique
  on public.activities (strava_activity_id);

create table if not exists public.strava_connections (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  athlete_id bigint not null unique,
  access_token text not null,
  refresh_token text not null,
  expires_at bigint not null,
  scope text not null default 'activity:read',
  connected_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.strava_oauth_states (
  state_hash text primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  expires_at timestamptz not null
);

alter table public.strava_connections enable row level security;
alter table public.strava_oauth_states enable row level security;
revoke all on public.strava_connections from anon, authenticated;
revoke all on public.strava_oauth_states from anon, authenticated;
grant all on public.strava_connections to service_role;
grant all on public.strava_oauth_states to service_role;

comment on table public.strava_connections is
  'Jetons OAuth privés; lecture et écriture réservées aux fonctions Edge avec service_role.';
comment on column public.activities.strava_activity_id is
  'Identifiant d’activité Strava, unique pour empêcher les imports en double.';

-- Only trusted server imports may set the Strava origin and identifier.
-- Keep the historical manual link and proof workflows unchanged.
create or replace function public.guard_strava_import_provenance()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $function$
begin
  if current_user in ('anon', 'authenticated')
     or coalesce(auth.jwt()->>'role', '') in ('anon', 'authenticated') then
    if tg_op = 'INSERT' then
      if new.source is distinct from 'manual' or new.strava_activity_id is not null then
        raise exception 'Provenance Strava réservée aux imports serveur' using errcode = '42501';
      end if;
    elsif new.source is distinct from old.source
       or new.strava_activity_id is distinct from old.strava_activity_id then
      raise exception 'Provenance Strava réservée aux imports serveur' using errcode = '42501';
    end if;
  end if;
  return new;
end;
$function$;

drop trigger if exists activity_import_provenance_guard on public.activities;
create trigger activity_import_provenance_guard
  before insert or update on public.activities
  for each row execute function public.guard_strava_import_provenance();
revoke execute on function public.guard_strava_import_provenance() from public, anon, authenticated;
