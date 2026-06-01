-- Restore reliable role checks for admin AI testing
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO service_role;

-- Make AI subscription/usage tables reachable through the API while RLS still controls rows
GRANT SELECT ON public.ai_subscription_plans TO anon, authenticated;
GRANT ALL ON public.ai_subscription_plans TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_ai_subscriptions TO authenticated;
GRANT ALL ON public.user_ai_subscriptions TO service_role;
GRANT SELECT, INSERT ON public.ai_usage TO authenticated;
GRANT ALL ON public.ai_usage TO service_role;
GRANT SELECT ON public.user_credits TO authenticated;
GRANT ALL ON public.user_credits TO service_role;
GRANT SELECT ON public.credit_history TO authenticated;
GRANT ALL ON public.credit_history TO service_role;
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

-- Admin visibility for monitoring dashboards
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'ai_usage' AND policyname = 'Admins can view all AI usage'
  ) THEN
    CREATE POLICY "Admins can view all AI usage"
    ON public.ai_usage
    FOR SELECT
    USING (public.has_role(auth.uid(), 'admin'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_credits' AND policyname = 'Admins can view all credits'
  ) THEN
    CREATE POLICY "Admins can view all credits"
    ON public.user_credits
    FOR SELECT
    USING (public.has_role(auth.uid(), 'admin'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'credit_history' AND policyname = 'Admins can view all credit history'
  ) THEN
    CREATE POLICY "Admins can view all credit history"
    ON public.credit_history
    FOR SELECT
    USING (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;

-- Fix AI access helper to use the real ai_usage.used_at column and support active plan fallback
CREATE OR REPLACE FUNCTION public.get_user_ai_access(_user_id uuid)
RETURNS TABLE(
  plan_id text,
  tier text,
  daily_limit integer,
  monthly_limit integer,
  allowed_services jsonb,
  status text,
  expires_at timestamptz,
  used_today integer,
  used_month integer
)
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
    COALESCE(p.daily_limit, CASE WHEN legacy.tier = 'pro' THEN 200 WHEN legacy.tier = 'premium' THEN 50 ELSE 1 END, 1) AS daily_limit,
    COALESCE(p.monthly_limit, CASE WHEN legacy.tier = 'pro' THEN 6000 WHEN legacy.tier = 'premium' THEN 1500 ELSE 30 END, 30) AS monthly_limit,
    COALESCE(
      p.allowed_services,
      CASE
        WHEN legacy.tier = 'pro' THEN '["ai-health-assistant","symptom-checker","ai-doctor-chat","ai-dietolog","ai-fitness","ai-psixolog","ai-pregnancy","ai-baby-care","ai-farmatsevt","ai-health-risk","ai-radiology","ai-report-analysis","ai-cosmetology","ai-vital-signs"]'::jsonb
        WHEN legacy.tier = 'premium' THEN '["ai-health-assistant","symptom-checker","ai-doctor-chat","ai-dietolog","ai-fitness","ai-psixolog","ai-pregnancy","ai-baby-care","ai-farmatsevt","ai-health-risk"]'::jsonb
        ELSE NULL
      END,
      '["ai-health-assistant","symptom-checker"]'::jsonb
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

GRANT EXECUTE ON FUNCTION public.get_user_ai_access(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_ai_access(uuid) TO service_role;

-- Fix refund helper to remove recent usage rows using used_at (not created_at)
CREATE OR REPLACE FUNCTION public.refund_ai_credits(_user_id uuid, _service_id text, _cost integer, _reason text DEFAULT 'AI service failure')
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
  v_new_balance integer;
BEGIN
  SELECT id INTO v_id FROM public.user_credits
    WHERE user_id = _user_id AND expires_at > now()
    ORDER BY expires_at DESC LIMIT 1 FOR UPDATE;

  IF v_id IS NOT NULL THEN
    UPDATE public.user_credits SET balance = balance + _cost, updated_at = now() WHERE id = v_id
    RETURNING balance INTO v_new_balance;
  ELSE
    INSERT INTO public.user_credits(user_id, balance, expires_at)
    VALUES (_user_id, _cost, now() + interval '30 days')
    RETURNING balance INTO v_new_balance;
  END IF;

  DELETE FROM public.ai_usage
    WHERE id IN (
      SELECT id FROM public.ai_usage
      WHERE user_id = _user_id AND service_id = _service_id AND used_at > now() - interval '5 minutes'
      ORDER BY used_at DESC LIMIT 1
    );

  INSERT INTO public.credit_history(user_id, amount, type, service_id, description, balance_after)
  VALUES (_user_id, _cost, 'refund', _service_id, 'Refund: ' || _reason, v_new_balance);

  RETURN v_new_balance;
END;
$$;

GRANT EXECUTE ON FUNCTION public.refund_ai_credits(uuid, text, integer, text) TO authenticated, service_role;