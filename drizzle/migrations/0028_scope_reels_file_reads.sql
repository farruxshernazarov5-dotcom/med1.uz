ALTER POLICY reels_files_read ON storage.objects TO authenticated USING (
  bucket_id = 'medical-reels'
  AND (storage.foldername(name))[1] = (SELECT auth.uid()::text)
  AND owner_id = (SELECT auth.uid()::text)
);
CREATE POLICY reels_files_admin_read ON storage.objects
FOR SELECT TO authenticated USING (
  bucket_id = 'medical-reels'
  AND public.has_role((SELECT auth.uid()), 'admin')
);
CREATE POLICY reels_files_approved_public_read ON storage.objects
FOR SELECT TO anon, authenticated USING (
  bucket_id = 'medical-reels'
  AND EXISTS (
    SELECT 1 FROM public.medical_reels r
    WHERE r.storage_path = objects.name
      AND r.status = 'approved'
      AND r.owner_id::text = objects.owner_id
      AND r.owner_id::text = (storage.foldername(objects.name))[1]
  )
);
COMMENT ON POLICY reels_files_read ON storage.objects IS 'Private uploads: only the authenticated object owner with a matching account folder can read.';
COMMENT ON POLICY reels_files_approved_public_read ON storage.objects IS 'Intentional public Med Reels feed: exact approved record must match both the stored object owner and account folder. Unpublished uploads are not public.';