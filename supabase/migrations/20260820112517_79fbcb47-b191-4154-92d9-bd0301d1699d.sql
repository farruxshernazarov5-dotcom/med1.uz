-- 1. contract_signatures: only actual contract parties may insert, and OTP/validity cannot be self-asserted
DROP POLICY IF EXISTS "Signer can insert own signature" ON public.contract_signatures;
CREATE POLICY "Contract party can insert own signature"
ON public.contract_signatures
FOR INSERT
TO authenticated
WITH CHECK (
  signer_id = auth.uid()
  AND COALESCE(otp_verified, false) = false
  AND EXISTS (
    SELECT 1 FROM public.contracts c
    WHERE c.id = contract_signatures.contract_id
      AND (c.owner_id = auth.uid() OR c.counterparty_id = auth.uid())
  )
);

-- 2. referrals: users may only create pending referrals with zero rewards
DROP POLICY IF EXISTS "anyone insert referral" ON public.referrals;
CREATE POLICY "referral_self_insert_pending"
ON public.referrals
FOR INSERT
TO authenticated
WITH CHECK (
  (auth.uid() = referred_user_id OR auth.uid() = referrer_id)
  AND status = 'pending'::public.referral_status
  AND COALESCE(reward_credits, 0) = 0
  AND COALESCE(reward_months, 0) = 0
  AND COALESCE(reward_ai_credits, 0) = 0
  AND approved_at IS NULL
);

-- 3. tenant_subscriptions: self-service rows limited to free/trial, no paid tiers or plans
DROP POLICY IF EXISTS "sub_owner_insert" ON public.tenant_subscriptions;
CREATE POLICY "sub_owner_insert"
ON public.tenant_subscriptions
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  OR (
    owner_id = auth.uid()
    AND COALESCE(tier, 'free') = 'free'
    AND COALESCE(status, 'trial') IN ('trial', 'inactive', 'expired')
    AND plan_id IS NULL
  )
);

DROP POLICY IF EXISTS "sub_admin_update" ON public.tenant_subscriptions;
CREATE POLICY "sub_admin_update"
ON public.tenant_subscriptions
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR owner_id = auth.uid())
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  OR (
    owner_id = auth.uid()
    AND COALESCE(tier, 'free') = 'free'
    AND COALESCE(status, 'trial') IN ('trial', 'inactive', 'expired')
    AND plan_id IS NULL
  )
);

-- 4. doctors: hide personal contact details from anonymous visitors
REVOKE SELECT ON public.doctors FROM anon;
GRANT SELECT (
  id, clinic_id, full_name, specialty, experience_years, photo_url, bio,
  consultation_price, is_active, created_at, certificates, schedule,
  avg_rating, review_count, user_id, education, languages,
  online_consultation, social_links, region, city
) ON public.doctors TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.doctors TO authenticated;
GRANT ALL ON public.doctors TO service_role;