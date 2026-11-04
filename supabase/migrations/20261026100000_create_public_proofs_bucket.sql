-- The new troupe project starts with an empty Storage instance.
-- Preserve the original site's public-URL behavior for proof photos, GPX files,
-- and seasonal/calendar background images.
insert into storage.buckets (id, name, public)
values
  ('proofs', 'proofs', true),
  ('backgrounds', 'backgrounds', true)
on conflict (id) do update
  set public = excluded.public;

-- Proof object access is scoped by the earlier owns_proof_object() policies.
-- Backgrounds are managed only by administrators; public URLs are used by the site.
drop policy if exists "backgrounds admin upload" on storage.objects;
create policy "backgrounds admin upload" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'backgrounds'
    and public.has_role(auth.uid(), 'admin')
  );

drop policy if exists "backgrounds admin update" on storage.objects;
create policy "backgrounds admin update" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'backgrounds'
    and public.has_role(auth.uid(), 'admin')
  )
  with check (
    bucket_id = 'backgrounds'
    and public.has_role(auth.uid(), 'admin')
  );

drop policy if exists "backgrounds admin delete" on storage.objects;
create policy "backgrounds admin delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'backgrounds'
    and public.has_role(auth.uid(), 'admin')
  );
