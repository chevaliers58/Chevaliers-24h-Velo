-- Only run against a disposable database; no historic fixture or real users.
\set ON_ERROR_STOP on
begin;
insert into auth.users(id,email,email_confirmed_at,raw_user_meta_data) values
  ('11111111-1111-1111-1111-111111111111','admin-secondary@example.com',now(),'{"full_name":"Admin Test"}'),
  ('22222222-2222-2222-2222-222222222222','scout-a-secondary@example.com',now(),'{"full_name":"Scout A"}'),
  ('33333333-3333-3333-3333-333333333333','scout-b-secondary@example.com',now(),'{"full_name":"Scout B"}');
insert into public.user_roles(user_id,role) values ('11111111-1111-1111-1111-111111111111','admin');

-- The app revokes default PUBLIC function EXECUTE. Grant only this temporary
-- test-session helper, which the historic scenarios replace in place.
create or replace function pg_temp.as_user(_uid text) returns void language plpgsql as $helper$
begin perform set_config('request.jwt.claim.sub', coalesce(_uid, ''), false); end; $helper$;
grant execute on function pg_temp.as_user(text) to authenticated, anon;

\echo 'RUN peloton'
\ir test_peloton.sql
\echo 'RUN marche'
\ir test_marche.sql
\echo 'RUN date debut'
\ir test_date_debut_defi.sql
\echo 'RUN corrections'
\ir test_corrections_sorties.sql
\echo 'RUN anniversaires'
\ir test_anniversaires.sql
\echo 'RUN scout sportif'
\ir test_scout_sportif_mois.sql
\echo 'RUN themes'
\ir test_theme_fetes.sql
\ir test_themes_hiver_carnaval_sports.sql
reset role;
rollback;
\echo 'SECONDARY_SMOKE_OK'
