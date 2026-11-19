-- A staff-created future ride generates one generic notification per approved member.
alter table public.app_notifications drop constraint app_notifications_kind_check;
alter table public.app_notifications add constraint app_notifications_kind_check
check (kind in ('weekly_reminder','distance_milestone','manual','new_signup',
  'individual_distance_milestone','troop_distance_milestone','activity_pending',
  'challenge_received','planned_ride','planned_ride_cancelled'));

create function chevaliers_private.notify_planned_ride_members()
returns trigger language plpgsql security definer set search_path='' as $$
declare event_kind text; message_title text; message_body text;
begin
  if not exists(select 1 from public.user_roles r join public.profiles p on p.id=r.user_id
      where r.user_id=new.created_by and r.role='admin' and p.member_approved) then return new; end if;
  if tg_op='INSERT' and not new.cancelled then
    event_kind:='planned_ride'; message_title:='Nouvelle sortie collective';
    message_body:='Le staff a prévu une sortie. Consulte le programme dans l’application.';
  elsif tg_op='UPDATE' and new.cancelled and not old.cancelled then
    event_kind:='planned_ride_cancelled'; message_title:='Sortie collective annulée';
    message_body:='Une sortie prévue a été annulée. Consulte le programme dans l’application.';
  else return new;
  end if;
  if new.ride_date < (now() at time zone 'Europe/Brussels')::date then return new; end if;
  insert into public.app_notifications(user_id,kind,title,body,href,dedupe_key)
  select p.id,event_kind,message_title,message_body,'/app/sorties-prevues',
    event_kind||':'||new.id::text||':'||p.id::text
  from public.profiles p join auth.users u on u.id=p.id
  where p.member_approved and u.email_confirmed_at is not null and p.id<>new.created_by
  on conflict(dedupe_key) do nothing;
  return new;
end;
$$;
revoke all on function chevaliers_private.notify_planned_ride_members() from public,anon,authenticated;
create trigger chevaliers_notify_planned_ride_members
after insert or update of cancelled on public.planned_rides
for each row execute function chevaliers_private.notify_planned_ride_members();
