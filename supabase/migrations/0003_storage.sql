-- ============================================================================
-- PaperRaj — 0003_storage.sql
-- Creates the PRIVATE storage bucket and its policies. Run AFTER 0001/0002.
--
-- The bucket is private on purpose: papers awaiting approval must not be
-- reachable by guessing a URL. The Next.js server (which holds the
-- service-role key, never exposed to the browser) uploads and deletes
-- objects, and issues short-lived signed URLs for reading.
-- ============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'paperraj-papers',
  'paperraj-papers',
  false,
  52428800, -- 50 MB (keep in sync with the max_upload_mb setting / MAX_UPLOAD_MB)
  array['application/pdf','image/jpeg','image/png','image/webp']
)
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- ------------------------------------------------------------------ read ---
drop policy if exists "service role reads objects" on storage.objects;
create policy "service role reads objects" on storage.objects
  for select to service_role using (bucket_id = 'paperraj-papers');

-- ---------------------------------------------------------------- write ---
drop policy if exists "service role writes objects" on storage.objects;
create policy "service role writes objects" on storage.objects
  for insert to service_role with check (bucket_id = 'paperraj-papers');

drop policy if exists "service role updates objects" on storage.objects;
create policy "service role updates objects" on storage.objects
  for update to service_role using (bucket_id = 'paperraj-papers');

-- ---------------------------------------------------------------- delete ---
drop policy if exists "service role deletes objects" on storage.objects;
create policy "service role deletes objects" on storage.objects
  for delete to service_role using (bucket_id = 'paperraj-papers');

-- ------------------------------------------- optional: direct client uploads
-- The PaperRaj UI always uploads through its own server, so these policies are
-- not required. They are provided so the bucket stays usable if you later add
-- direct-from-browser uploads with Supabase Storage.
drop policy if exists "authenticated users may upload to papers folder" on storage.objects;
create policy "authenticated users may upload to papers folder" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'paperraj-papers'
    and (storage.foldername(name))[1] = 'papers'
  );

drop policy if exists "authenticated users may not delete" on storage.objects;
create policy "authenticated users may not delete" on storage.objects
  for delete to authenticated using (false);
