
-- 1. Fix telegram_otp: remove public SELECT policy
DROP POLICY IF EXISTS "Anyone can read telegram_otp" ON public.telegram_otp;

-- No user-facing SELECT policy needed - only edge functions (service role) read this table.
-- The send-otp and verify-otp endpoints use service role key already.

-- 2. Fix dental-files storage: drop weak policies and add ownership-based ones
DROP POLICY IF EXISTS "Dental file owners can view" ON storage.objects;
DROP POLICY IF EXISTS "Dental file owners can upload" ON storage.objects;
DROP POLICY IF EXISTS "Dental file owners can delete" ON storage.objects;

-- Clinic owners can view their files
CREATE POLICY "Dental files: clinic owners can view"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'dental-files'
  AND EXISTS (
    SELECT 1 FROM public.dental_files df
    JOIN public.registered_dental_clinics rdc ON rdc.id = df.clinic_id
    WHERE df.file_url LIKE '%' || storage.objects.name
      AND rdc.owner_id = auth.uid()
  )
);

-- Clinic owners can upload files (path starts with clinic_id)
CREATE POLICY "Dental files: clinic owners can upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'dental-files'
  AND EXISTS (
    SELECT 1 FROM public.registered_dental_clinics
    WHERE owner_id = auth.uid()
  )
);

-- Clinic owners can delete their files
CREATE POLICY "Dental files: clinic owners can delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'dental-files'
  AND EXISTS (
    SELECT 1 FROM public.dental_files df
    JOIN public.registered_dental_clinics rdc ON rdc.id = df.clinic_id
    WHERE df.file_url LIKE '%' || storage.objects.name
      AND rdc.owner_id = auth.uid()
  )
);
