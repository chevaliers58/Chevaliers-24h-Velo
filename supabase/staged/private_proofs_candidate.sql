-- CANDIDATE ONLY: run in isolated CI, not against the active preview.
-- Promoting this file requires a compatible client and a Storage API smoke test.
-- Bucket policy is authoritative even if a participant knows the object path.
update storage.buckets set public = false where id = 'proofs';

-- Existing permissive policies may grant the owner SELECT/UPDATE/DELETE.
-- Restrictive guards are ANDed with any permissive policy; other buckets unaffected.
create policy chevaliers_proofs_staff_read
  on storage.objects as restrictive for select to anon, authenticated
  using (bucket_id <> 'proofs' or (select public.has_role(auth.uid(), 'admin')));
create policy chevaliers_proofs_staff_update
  on storage.objects as restrictive for update to anon, authenticated
  using (bucket_id <> 'proofs' or (select public.has_role(auth.uid(), 'admin')))
  with check (bucket_id <> 'proofs' or (select public.has_role(auth.uid(), 'admin')));
create policy chevaliers_proofs_staff_delete
  on storage.objects as restrictive for delete to anon, authenticated
  using (bucket_id <> 'proofs' or (select public.has_role(auth.uid(), 'admin')));

-- New uploads: verified account, unique owner prefix, no upsert. Staff have
-- their existing administrative access; never derive authorization from a totem.
create policy chevaliers_proofs_scoped_insert
  on storage.objects as restrictive for insert to anon, authenticated
  with check (
    bucket_id <> 'proofs'
    or (
      auth.uid() is not null
      and (
        (select public.has_role(auth.uid(), 'admin'))
        or (storage.foldername(name))[1] = auth.uid()::text
        or left(name, length(auth.uid()::text) + 1) = auth.uid()::text || '_'
      )
    )
  );
