CREATE OR REPLACE FUNCTION public.get_user_ai_access(_user_id uuid)
RETURNS TABLE(plan_id text, tier text, daily_limit integer, monthly_limit integer, allowed_services jsonb, status text, expires_at timestamptz, used_today integer, used_month integer)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_today_start timestamptz := date_trunc('day', now());
  v_month_start timestamptz := date_trunc('month', now());
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(s.plan_id, legacy.plan_id, 'free') AS plan_id,
    COALESCE(p.tier, legacy.tier, 'free') AS tier,
    COALESCE(p.daily_limit, CASE WHEN legacy.tier = 'pro' THEN 200 WHEN legacy.tier = 'premium' THEN 50 ELSE 2 END, 2) AS daily_limit,
    COALESCE(p.monthly_limit, CASE WHEN legacy.tier = 'pro' THEN 6000 WHEN legacy.tier = 'premium' THEN 1500 ELSE 30 END, 30) AS monthly_limit,
    COALESCE(
      p.allowed_services,
      CASE
        WHEN legacy.tier = 'pro' THEN '["ai-health-assistant","symptom-checker","ai-doctor-chat","ai-dietolog","ai-fitness","ai-psixolog","ai-pregnancy","ai-baby-care","ai-farmatsevt","ai-health-risk","ai-radiology","ai-report-analysis","ai-cosmetology","ai-vital-signs"]'::jsonb
        WHEN legacy.tier = 'premium' THEN '["ai-health-assistant","symptom-checker","ai-doctor-chat","ai-dietolog","ai-fitness","ai-psixolog","ai-pregnancy","ai-baby-care","ai-farmatsevt","ai-health-risk"]'::jsonb
        ELSE NULL
      END,
      '["ai-health-assistant","ai-doctor-chat","ai-dietolog","ai-fitness","ai-baby-care","ai-farmatsevt","ai-orchestrator"]'::jsonb
    ) AS allowed_services,
    COALESCE(s.status, legacy.status, 'active') AS status,
    COALESCE(s.expires_at, legacy.expires_at) AS expires_at,
    (SELECT COUNT(*)::int FROM public.ai_usage WHERE user_id = _user_id AND used_at >= v_today_start) AS used_today,
    (SELECT COUNT(*)::int FROM public.ai_usage WHERE user_id = _user_id AND used_at >= v_month_start) AS used_month
  FROM (SELECT 1) x
  LEFT JOIN LATERAL (
    SELECT uas.plan_id, uas.status, uas.expires_at
    FROM public.user_ai_subscriptions uas
    WHERE uas.user_id = _user_id
      AND uas.status = 'active'
      AND (uas.expires_at IS NULL OR uas.expires_at > now())
    ORDER BY uas.created_at DESC
    LIMIT 1
  ) s ON true
  LEFT JOIN public.ai_subscription_plans p ON p.id = s.plan_id
  LEFT JOIN LATERAL (
    SELECT ais.plan_id, ais.tier, ais.status, ais.expires_at
    FROM public.ai_subscriptions ais
    WHERE ais.user_id = _user_id
      AND ais.status = 'active'
      AND (ais.expires_at IS NULL OR ais.expires_at > now())
    ORDER BY ais.created_at DESC
    LIMIT 1
  ) legacy ON true
  LIMIT 1;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_user_ai_access(uuid) TO authenticated, service_role;

CREATE INDEX IF NOT EXISTS idx_doctors_external_specialty_rating_reviews
  ON public.doctors_external (primary_specialty, rating DESC, reviews_count DESC);
CREATE INDEX IF NOT EXISTS idx_doctors_external_region_rating_reviews
  ON public.doctors_external (primary_region, rating DESC, reviews_count DESC);
CREATE INDEX IF NOT EXISTS idx_doctors_external_specialty_trgm
  ON public.doctors_external USING gin (primary_specialty gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_doctors_external_rank_trgm
  ON public.doctors_external USING gin (rank gin_trgm_ops);