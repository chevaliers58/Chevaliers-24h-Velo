-- Deprecated legacy bootstrap script.
-- Do not execute this file: it contains the original project's permissive setup
-- and data backfill. A fresh installation must use the reviewed migrations in
-- supabase/migrations/ and create the first administrator with bootstrap_admin.sql.

do $guard$
begin
  raise exception 'Script historique désactivé. Appliquer uniquement les migrations versionnées de supabase/migrations/.';
end
$guard$;
