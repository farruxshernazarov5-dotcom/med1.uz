-- 1) marketing_analytics: scope UPDATE to admin OR owner of the promotion
DROP POLICY IF EXISTS "System updates analytics" ON public.marketing_analytics;
CREATE POLICY "Owners update analytics"
ON public.marketing_analytics
FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR EXISTS (
    SELECT 1 FROM public.promotions p
    WHERE p.id = marketing_analytics.promotion_id AND p.owner_id = auth.uid()
  )
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR EXISTS (
    SELECT 1 FROM public.promotions p
    WHERE p.id = marketing_analytics.promotion_id AND p.owner_id = auth.uid()
  )
);

-- 2) user_credits: drop client-facing INSERT policy — only service role inserts credits
DROP POLICY IF EXISTS "Users can insert own credits" ON public.user_credits;

-- 3) dental-files storage upload: must scope folder path to a clinic the caller owns
DROP POLICY IF EXISTS "Dental files: clinic owners can upload" ON storage.objects;
CREATE POLICY "Dental files: clinic owners can upload"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'dental-files'
  AND EXISTS (
    SELECT 1 FROM public.registered_dental_clinics rdc
    WHERE rdc.id::text = (storage.foldername(name))[1]
      AND rdc.owner_id = auth.uid()
  )
);

-- 4) cosmetology storage policies: fix broken foldername(c.name) -> foldername(objects.name)
DROP POLICY IF EXISTS "Cosmetology owners can upload files" ON storage.objects;
CREATE POLICY "Cosmetology owners can upload files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'cosmetology-files' AND (
    (auth.uid())::text = (storage.foldername(name))[1]
    OR EXISTS (
      SELECT 1 FROM public.registered_cosmetology c
      WHERE c.id::text = (storage.foldername(name))[1]
        AND c.owner_id = auth.uid()
    )
  )
);

DROP POLICY IF EXISTS "Cosmetology owners can delete own files" ON storage.objects;
CREATE POLICY "Cosmetology owners can delete own files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'cosmetology-files' AND (
    (auth.uid())::text = (storage.foldername(name))[1]
    OR EXISTS (
      SELECT 1 FROM public.registered_cosmetology c
      WHERE c.id::text = (storage.foldername(name))[1]
        AND c.owner_id = auth.uid()
    )
  )
);

-- 5) maternity storage policies: fix same bug
DROP POLICY IF EXISTS "Maternity owners can upload files" ON storage.objects;
CREATE POLICY "Maternity owners can upload files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'maternity-files' AND (
    (auth.uid())::text = (storage.foldername(name))[1]
    OR EXISTS (
      SELECT 1 FROM public.registered_maternity m
      WHERE m.id::text = (storage.foldername(name))[1]
        AND m.owner_id = auth.uid()
    )
  )
);

DROP POLICY IF EXISTS "Maternity owners can delete own files" ON storage.objects;
CREATE POLICY "Maternity owners can delete own files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'maternity-files' AND (
    (auth.uid())::text = (storage.foldername(name))[1]
    OR EXISTS (
      SELECT 1 FROM public.registered_maternity m
      WHERE m.id::text = (storage.foldername(name))[1]
        AND m.owner_id = auth.uid()
    )
  )
);

-- 6) contract_signature_otps: hide otp_code column from client; only service role validates
REVOKE SELECT ON public.contract_signature_otps FROM authenticated;
GRANT SELECT (id, contract_id, user_id, channel, attempts, consumed_at, expires_at, created_at)
  ON public.contract_signature_otps TO authenticated;

-- 7) Revoke EXECUTE on SECURITY DEFINER functions from anon (they are not meant to be public)
REVOKE EXECUTE ON FUNCTION public.enqueue_webhook_event(text, jsonb) FROM anon;
REVOKE EXECUTE ON FUNCTION public.generate_referral_code(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.ensure_referral_wallet(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.release_held_referral_rewards() FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_referral_stats(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.apply_referral_reward(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.revoke_referral_reward(uuid, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.ensure_referral_code(uuid, text, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.verify_contract_signatures(text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_review_contract(uuid, text, text) FROM anon;