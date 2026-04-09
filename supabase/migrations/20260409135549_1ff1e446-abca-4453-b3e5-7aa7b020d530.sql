
-- =====================================================
-- 1. FIX: telegram_otp - Remove public access entirely
-- =====================================================
DROP POLICY IF EXISTS "Anyone can read/write telegram_otp for verification" ON public.telegram_otp;

-- Only service_role can access (edge functions use service_role)
CREATE POLICY "Service role full access to telegram_otp"
  ON public.telegram_otp
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- 2. FIX: audit_logs - Remove authenticated INSERT
-- =====================================================
DROP POLICY IF EXISTS "System can insert audit logs" ON public.audit_logs;

-- Only service_role can insert audit logs
CREATE POLICY "Service role can insert audit logs"
  ON public.audit_logs
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- =====================================================
-- 3. FIX: ai_subscriptions - Remove client INSERT
-- =====================================================
DROP POLICY IF EXISTS "Users can insert own subscriptions" ON public.ai_subscriptions;

-- Only service_role (payment webhook edge function) can insert
CREATE POLICY "Service role can insert subscriptions"
  ON public.ai_subscriptions
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- =====================================================
-- 4. FIX: ai_payments - Remove client INSERT
-- =====================================================
DROP POLICY IF EXISTS "Users can insert own payments" ON public.ai_payments;

-- Only service_role can insert payments
CREATE POLICY "Service role can insert payments"
  ON public.ai_payments
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- =====================================================
-- 5. FIX: Storage DELETE policies - Add ownership checks
-- =====================================================

-- clinic-photos: Only clinic owner can delete
DROP POLICY IF EXISTS "Users can delete own clinic photos" ON storage.objects;
CREATE POLICY "Clinic owners can delete own clinic photos"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'clinic-photos'
    AND EXISTS (
      SELECT 1 FROM public.registered_clinics
      WHERE id::text = (storage.foldername(name))[1]
      AND owner_id = auth.uid()
    )
  );

-- cosmetology-files: Only center owner can delete
DROP POLICY IF EXISTS "Owners can delete cosmetology files" ON storage.objects;
CREATE POLICY "Cosmetology owners can delete own files"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'cosmetology-files'
    AND EXISTS (
      SELECT 1 FROM public.registered_cosmetology
      WHERE id::text = (storage.foldername(name))[1]
      AND owner_id = auth.uid()
    )
  );

-- maternity-files: Only facility owner can delete
DROP POLICY IF EXISTS "Owners can delete maternity files" ON storage.objects;
CREATE POLICY "Maternity owners can delete own files"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'maternity-files'
    AND EXISTS (
      SELECT 1 FROM public.registered_maternity
      WHERE id::text = (storage.foldername(name))[1]
      AND owner_id = auth.uid()
    )
  );

-- =====================================================
-- 6. FIX: dental_appointments - Add patient SELECT
-- =====================================================
CREATE POLICY "Patients can view own dental appointments"
  ON public.dental_appointments
  FOR SELECT
  TO authenticated
  USING (patient_id = auth.uid());
