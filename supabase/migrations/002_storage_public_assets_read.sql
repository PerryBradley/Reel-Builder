-- Public read for all objects in the public-assets bucket (run in Supabase SQL editor if migrations not applied to storage).
create policy "Allow public read of all files in public-assets"
  on storage.objects for select
  using (bucket_id = 'public-assets');
