-- Preserve secure owner access for private buckets while supporting both user-id and organization-id folder layouts.
DROP POLICY IF EXISTS "Cos files owner read" ON storage.objects;
CREATE POLICY "Cos files owner read"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'cosmetology-files'
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR EXISTS (
      SELECT 1 FROM public.registered_cosmetology c
      WHERE c.id::text = (storage.foldername(name))[1]
        AND c.owner_id = auth.uid()
    )
  )
);

DROP POLICY IF EXISTS "Mat files owner read" ON storage.objects;
CREATE POLICY "Mat files owner read"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'maternity-files'
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR EXISTS (
      SELECT 1 FROM public.registered_maternity m
      WHERE m.id::text = (storage.foldername(name))[1]
        AND m.owner_id = auth.uid()
    )
  )
);

DROP POLICY IF EXISTS "MedTech files owner read" ON storage.objects;
CREATE POLICY "MedTech files owner read"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'medtech-files'
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR EXISTS (
      SELECT 1 FROM public.medtech_vendors v
      WHERE v.id::text = (storage.foldername(name))[1]
        AND v.owner_id = auth.uid()
    )
  )
);

DROP POLICY IF EXISTS "Authenticated users can upload cosmetology files" ON storage.objects;
CREATE POLICY "Cosmetology owners can upload files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'cosmetology-files'
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR EXISTS (
      SELECT 1 FROM public.registered_cosmetology c
      WHERE c.id::text = (storage.foldername(name))[1]
        AND c.owner_id = auth.uid()
    )
  )
);

DROP POLICY IF EXISTS "Authenticated users can upload maternity files" ON storage.objects;
CREATE POLICY "Maternity owners can upload files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'maternity-files'
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR EXISTS (
      SELECT 1 FROM public.registered_maternity m
      WHERE m.id::text = (storage.foldername(name))[1]
        AND m.owner_id = auth.uid()
    )
  )
);

DROP POLICY IF EXISTS "Authenticated users can upload medtech files" ON storage.objects;
CREATE POLICY "MedTech owners can upload files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'medtech-files'
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR EXISTS (
      SELECT 1 FROM public.medtech_vendors v
      WHERE v.id::text = (storage.foldername(name))[1]
        AND v.owner_id = auth.uid()
    )
  )
);