
DROP VIEW IF EXISTS public.referral_leaderboard;
CREATE VIEW public.referral_leaderboard
WITH (security_invoker = true) AS
SELECT
  rc.owner_id,
  COALESCE(rc.org_role,'patient') AS org_role,
  rc.total_uses,
  rc.total_rewards_credits,
  ROW_NUMBER() OVER (ORDER BY rc.total_uses DESC, rc.total_rewards_credits DESC) AS rank
FROM public.referral_codes rc
WHERE rc.is_active = true AND rc.total_uses > 0
ORDER BY rc.total_uses DESC
LIMIT 100;
