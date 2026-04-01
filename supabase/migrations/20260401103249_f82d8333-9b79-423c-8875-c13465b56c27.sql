
DROP POLICY IF EXISTS "Clinic staff can create verifications" ON public.document_verifications;
CREATE POLICY "Authenticated users can create verifications" ON public.document_verifications
  FOR INSERT TO authenticated WITH CHECK (true);
