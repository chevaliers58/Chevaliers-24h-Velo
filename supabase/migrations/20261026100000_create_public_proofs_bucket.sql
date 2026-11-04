-- The new troupe project starts with an empty Storage instance.
-- Preserve the original site's public-URL behavior for proof photos and GPX files.
-- Object writes/updates/deletes remain governed by the scoped policies on storage.objects.
insert into storage.buckets (id, name, public)
values ('proofs', 'proofs', true)
on conflict (id) do update
  set public = excluded.public;
