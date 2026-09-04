-- Allow anon (admin client) to read, upload, update, and delete files
-- in the academy-resources storage bucket.
-- Without these policies, the default is to deny all writes to storage.objects.
DROP POLICY IF EXISTS anon_select_academy_resources ON storage.objects;
CREATE POLICY anon_select_academy_resources ON storage.objects
FOR SELECT TO anon
USING (bucket_id = 'academy-resources');

DROP POLICY IF EXISTS anon_upload_academy_resources ON storage.objects;
CREATE POLICY anon_upload_academy_resources ON storage.objects
FOR INSERT TO anon
WITH CHECK (bucket_id = 'academy-resources');

DROP POLICY IF EXISTS anon_update_academy_resources ON storage.objects;
CREATE POLICY anon_update_academy_resources ON storage.objects
FOR UPDATE TO anon
USING (bucket_id = 'academy-resources');

DROP POLICY IF EXISTS anon_delete_academy_resources ON storage.objects;
CREATE POLICY anon_delete_academy_resources ON storage.objects
FOR DELETE TO anon
USING (bucket_id = 'academy-resources');
