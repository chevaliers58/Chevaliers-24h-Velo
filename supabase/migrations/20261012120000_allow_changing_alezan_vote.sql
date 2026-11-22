-- On a clean installation the former mascot vote never existed. Preserve the
-- historical policy upgrade only for databases that actually have the table.
do $migration$
begin
  if to_regclass('public.alezan_name_votes') is null then
    return;
  end if;
  grant update (suggestion_id) on table public.alezan_name_votes to authenticated;
  drop policy if exists "alezan_name_votes_change_own_vote" on public.alezan_name_votes;
  create policy "alezan_name_votes_change_own_vote"
    on public.alezan_name_votes
    for update
    to authenticated
    using (user_id = auth.uid())
    with check (user_id = auth.uid());
end;
$migration$;
