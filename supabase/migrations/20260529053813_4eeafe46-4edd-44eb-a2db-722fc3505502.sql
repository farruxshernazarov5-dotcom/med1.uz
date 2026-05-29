-- 1) platform_payments: only service_role can INSERT (webhooks)
DROP POLICY IF EXISTS "Users insert own platform payments" ON public.platform_payments;
-- (no replacement INSERT policy for authenticated → service_role bypasses RLS)

-- 2) referral_wallet: remove direct UPDATE by owners; only service_role mutates balances
DROP POLICY IF EXISTS "owner update wallet" ON public.referral_wallet;
-- Owners keep SELECT via existing "owner read wallet". INSERT policy kept (creates empty wallet row).

-- 3) Revoke EXECUTE on SECURITY DEFINER functions from anon/public, then re-grant only to roles that need them.
REVOKE EXECUTE ON FUNCTION public.admin_review_contract(uuid, text, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.apply_referral_reward(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.enqueue_webhook_event(text, jsonb) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.ensure_referral_code(uuid, text, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.ensure_referral_wallet(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.generate_referral_code(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_referral_stats(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.release_held_referral_rewards() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.revoke_referral_reward(uuid, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.verify_contract_signatures(text) FROM PUBLIC;
-- trigger functions: revoke from public/anon (Postgres engine fires triggers regardless)
REVOKE EXECUTE ON FUNCTION public.contract_after_signature() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.trg_appointments_webhook_created() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.trg_referral_on_subscription() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.update_claim_from_splits() FROM PUBLIC, anon;

-- Re-grant to authenticated where users legitimately call the function
GRANT EXECUTE ON FUNCTION public.generate_referral_code(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_referral_stats(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.ensure_referral_code(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.ensure_referral_wallet(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_review_contract(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.apply_referral_reward(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.release_held_referral_rewards() TO authenticated;
GRANT EXECUTE ON FUNCTION public.revoke_referral_reward(uuid, text) TO authenticated;
-- Public verification page must remain accessible without sign-in
GRANT EXECUTE ON FUNCTION public.verify_contract_signatures(text) TO anon, authenticated;