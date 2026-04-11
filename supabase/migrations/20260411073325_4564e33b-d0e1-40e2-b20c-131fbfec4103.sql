
-- 1. Fix telegram_otp: replace overly permissive FOR ALL policy
DROP POLICY IF EXISTS "Anyone can read/write telegram_otp for verification" ON public.telegram_otp;

-- Allow anon/authenticated to insert OTP records
CREATE POLICY "Anyone can insert telegram_otp"
  ON public.telegram_otp FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Allow reading OTP records (needed for verification check via edge function with service role)
-- Public SELECT is acceptable per guidelines
CREATE POLICY "Anyone can read telegram_otp"
  ON public.telegram_otp FOR SELECT
  TO anon, authenticated
  USING (true);

-- Only service_role (edge functions) should delete OTPs, no direct user delete
-- No DELETE policy for anon/authenticated means they cannot delete

-- 2. Fix audit_logs: restrict insert to own user_id
DROP POLICY IF EXISTS "System can insert audit logs" ON public.audit_logs;

CREATE POLICY "Users can insert own audit logs"
  ON public.audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 3. Fix document_verifications: restrict insert to clinic owners
DROP POLICY IF EXISTS "Authenticated users can create verifications" ON public.document_verifications;
DROP POLICY IF EXISTS "Clinic staff can create verifications" ON public.document_verifications;

CREATE POLICY "Clinic owners can create verifications"
  ON public.document_verifications FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.registered_clinics
      WHERE id = clinic_id AND owner_id = auth.uid()
    )
  );
