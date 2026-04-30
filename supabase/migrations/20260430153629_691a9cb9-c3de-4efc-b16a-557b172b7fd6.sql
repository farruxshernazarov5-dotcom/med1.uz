-- ═══════════════════════════════════════════════════════════
-- AI SUBSCRIPTION & LIMIT CONTROL SYSTEM
-- ═══════════════════════════════════════════════════════════

-- 1. AI Subscription Plans (Free / Premium / Pro)
CREATE TABLE IF NOT EXISTS public.ai_subscription_plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  name_uz TEXT NOT NULL,
  tier TEXT NOT NULL CHECK (tier IN ('free','premium','pro')),
  price_monthly NUMERIC(10,2) NOT NULL DEFAULT 0,
  price_yearly NUMERIC(10,2) NOT NULL DEFAULT 0,
  monthly_credits INTEGER NOT NULL DEFAULT 0,
  daily_limit INTEGER NOT NULL DEFAULT 1,
  monthly_limit INTEGER NOT NULL DEFAULT 30,
  allowed_services JSONB NOT NULL DEFAULT '[]'::jsonb,
  features JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_subscription_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active plans"
  ON public.ai_subscription_plans FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins manage plans"
  ON public.ai_subscription_plans FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 2. User AI Subscriptions
CREATE TABLE IF NOT EXISTS public.user_ai_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  plan_id TEXT NOT NULL REFERENCES public.ai_subscription_plans(id),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','expired','cancelled')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  auto_renew BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_ai_sub_user ON public.user_ai_subscriptions(user_id);

ALTER TABLE public.user_ai_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own subscription"
  ON public.user_ai_subscriptions FOR SELECT
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage subscriptions"
  ON public.user_ai_subscriptions FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_user_ai_sub_updated
  BEFORE UPDATE ON public.user_ai_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- 3. Helper: Get effective AI access for user
CREATE OR REPLACE FUNCTION public.get_user_ai_access(_user_id UUID)
RETURNS TABLE(
  plan_id TEXT,
  tier TEXT,
  daily_limit INTEGER,
  monthly_limit INTEGER,
  allowed_services JSONB,
  status TEXT,
  expires_at TIMESTAMPTZ,
  used_today INTEGER,
  used_month INTEGER
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_today_start TIMESTAMPTZ := date_trunc('day', now());
  v_month_start TIMESTAMPTZ := date_trunc('month', now());
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(s.plan_id, 'free') AS plan_id,
    COALESCE(p.tier, 'free') AS tier,
    COALESCE(p.daily_limit, 1) AS daily_limit,
    COALESCE(p.monthly_limit, 30) AS monthly_limit,
    COALESCE(p.allowed_services, '["ai-health-assistant","symptom-checker"]'::jsonb) AS allowed_services,
    COALESCE(s.status, 'active') AS status,
    s.expires_at,
    (SELECT COUNT(*)::INT FROM public.ai_usage WHERE user_id = _user_id AND created_at >= v_today_start) AS used_today,
    (SELECT COUNT(*)::INT FROM public.ai_usage WHERE user_id = _user_id AND created_at >= v_month_start) AS used_month
  FROM (SELECT 1) x
  LEFT JOIN public.user_ai_subscriptions s ON s.user_id = _user_id
  LEFT JOIN public.ai_subscription_plans p ON p.id = s.plan_id
  LIMIT 1;
END;
$$;

-- 4. Seed default plans
INSERT INTO public.ai_subscription_plans (id, name, name_uz, tier, price_monthly, price_yearly, monthly_credits, daily_limit, monthly_limit, allowed_services, features, sort_order)
VALUES
  ('free', 'Free', 'Bepul', 'free', 0, 0, 0, 1, 30,
    '["ai-health-assistant","symptom-checker"]'::jsonb,
    '["Asosiy AI yordamchi","Kuniga 1 ta so''rov","Simptom tekshiruvi"]'::jsonb, 1),
  ('premium', 'Premium', 'Premium', 'premium', 49000, 490000, 100, 20, 500,
    '["ai-health-assistant","symptom-checker","ai-doctor-chat","ai-dietolog","ai-fitness","ai-psixolog","ai-pregnancy","ai-baby-care","ai-farmatsevt","ai-health-risk"]'::jsonb,
    '["10+ AI xizmat","Kuniga 20 so''rov","Oyiga 100 kredit","Email qo''llab-quvvatlash"]'::jsonb, 2),
  ('pro', 'Pro', 'Pro', 'pro', 149000, 1490000, 500, 100, 3000,
    '["ai-health-assistant","symptom-checker","ai-doctor-chat","ai-dietolog","ai-fitness","ai-psixolog","ai-pregnancy","ai-baby-care","ai-farmatsevt","ai-health-risk","ai-radiology","ai-report-analysis","ai-cosmetology","ai-vital-signs"]'::jsonb,
    '["Barcha AI xizmatlar","Kuniga 100 so''rov","Oyiga 500 kredit","Vizual tahlil (Radiologiya)","Premium qo''llab-quvvatlash"]'::jsonb, 3)
ON CONFLICT (id) DO UPDATE SET
  monthly_credits = EXCLUDED.monthly_credits,
  daily_limit = EXCLUDED.daily_limit,
  monthly_limit = EXCLUDED.monthly_limit,
  allowed_services = EXCLUDED.allowed_services,
  features = EXCLUDED.features,
  updated_at = now();