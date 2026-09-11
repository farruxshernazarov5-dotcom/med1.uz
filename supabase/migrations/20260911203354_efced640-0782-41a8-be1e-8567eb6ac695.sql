CREATE POLICY "Owners can delete their org gallery files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'clinic-photos'
  AND (storage.foldername(name))[1] = 'org-gallery'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

CREATE POLICY "Owners can update their org gallery files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'clinic-photos'
  AND (storage.foldername(name))[1] = 'org-gallery'
  AND (storage.foldername(name))[2] = auth.uid()::text
);