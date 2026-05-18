
-- ============================================================================
-- REFERRAL & PARTNER REWARD SYSTEM
-- ============================================================================

-- Enums
DO $$ BEGIN
  CREATE TYPE public.referral_status AS ENUM ('pending','registered','subscribed','approved','rejected','fraud');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.referral_tier_level AS ENUM ('bronze','silver','gold','platinum','vip');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.referral_reward_kind AS ENUM ('credits','months','ai_credits');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================================
-- TABLES
-- ============================================================================

-- 1. referral_codes
CREATE TABLE IF NOT EXISTS public.referral_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL,
  code TEXT NOT NULL UNIQUE,
  kind TEXT NOT NULL DEFAULT 'org' CHECK (kind IN ('org','patient')),
  org_role TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  total_uses INT NOT NULL DEFAULT 0,
  total_rewards_credits NUMERIC NOT NULL DEFAULT 0,
  total_rewards_months INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_referral_codes_owner ON public.referral_codes(owner_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_referral_codes_code ON public.referral_codes(code);

-- 2. referrals
CREATE TABLE IF NOT EXISTS public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code_id UUID REFERENCES public.referral_codes(id) ON DELETE SET NULL,
  code_text TEXT,
  referrer_id UUID NOT NULL,
  referred_user_id UUID,
  referred_email TEXT,
  referred_org_role TEXT,
  status public.referral_status NOT NULL DEFAULT 'pending',
  subscription_tier TEXT,
  subscription_module TEXT,
  reward_credits NUMERIC NOT NULL DEFAULT 0,
  reward_months INT NOT NULL DEFAULT 0,
  reward_ai_credits NUMERIC NOT NULL DEFAULT 0,
  registered_at TIMESTAMPTZ,
  subscribed_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  rejected_reason TEXT,
  ip_address TEXT,
  device_fingerprint TEXT,
  meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT no_self_referral CHECK (referrer_id <> referred_user_id OR referred_user_id IS NULL)
);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON public.referrals(referrer_id, status);
CREATE INDEX IF NOT EXISTS idx_referrals_referred_user ON public.referrals(referred_user_id);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON public.referrals(status, created_at DESC);

-- 3. referral_rewards_ledger
CREATE TABLE IF NOT EXISTS public.referral_rewards_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  referral_id UUID REFERENCES public.referrals(id) ON DELETE SET NULL,
  kind public.referral_reward_kind NOT NULL,
  amount NUMERIC NOT NULL,
  applied_to TEXT NOT NULL DEFAULT 'wallet' CHECK (applied_to IN ('wallet','subscription','ai_subscription','manual')),
  balance_before NUMERIC,
  balance_after NUMERIC,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ledger_user ON public.referral_rewards_ledger(user_id, created_at DESC);

-- 4. referral_wallet
CREATE TABLE IF NOT EXISTS public.referral_wallet (
  owner_id UUID PRIMARY KEY,
  credits_balance NUMERIC NOT NULL DEFAULT 0,
  ai_credits_balance NUMERIC NOT NULL DEFAULT 0,
  months_balance INT NOT NULL DEFAULT 0,
  lifetime_earned NUMERIC NOT NULL DEFAULT 0,
  lifetime_spent NUMERIC NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. referral_promo_codes
CREATE TABLE IF NOT EXISTS public.referral_promo_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  discount_pct NUMERIC NOT NULL DEFAULT 0,
  bonus_months INT NOT NULL DEFAULT 0,
  bonus_credits NUMERIC NOT NULL DEFAULT 0,
  bonus_ai_credits NUMERIC NOT NULL DEFAULT 0,
  applicable_tiers JSONB NOT NULL DEFAULT '["basic","premium","ai_pro"]'::jsonb,
  applicable_modules JSONB NOT NULL DEFAULT '[]'::jsonb,
  max_uses INT,
  used_count INT NOT NULL DEFAULT 0,
  valid_from TIMESTAMPTZ NOT NULL DEFAULT now(),
  valid_until TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_promo_codes_active ON public.referral_promo_codes(code) WHERE is_active = true;

-- 6. referral_tiers (lookup)
CREATE TABLE IF NOT EXISTS public.referral_tiers (
  level public.referral_tier_level PRIMARY KEY,
  display_name TEXT NOT NULL,
  min_referrals INT NOT NULL,
  bonus_multiplier NUMERIC NOT NULL DEFAULT 1.0,
  perks JSONB NOT NULL DEFAULT '[]'::jsonb,
  color TEXT,
  icon TEXT
);

INSERT INTO public.referral_tiers (level, display_name, min_referrals, bonus_multiplier, color, icon) VALUES
  ('bronze','Bronze',0,1.0,'#cd7f32','Medal'),
  ('silver','Silver',5,1.1,'#c0c0c0','Award'),
  ('gold','Gold',10,1.25,'#ffd700','Trophy'),
  ('platinum','Platinum',25,1.4,'#7B61FF','Crown'),
  ('vip','VIP',50,1.5,'#2F80ED','Gem')
ON CONFLICT (level) DO NOTHING;

-- 7. referral_notifications
CREATE TABLE IF NOT EXISTS public.referral_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ref_notif_user ON public.referral_notifications(user_id, is_read, created_at DESC);

-- 8. referral_settings (singleton)
CREATE TABLE IF NOT EXISTS public.referral_settings (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  base_reward_basic JSONB NOT NULL DEFAULT '{"credits":50000,"months":1,"ai_credits":0}'::jsonb,
  base_reward_premium JSONB NOT NULL DEFAULT '{"credits":150000,"months":2,"ai_credits":100}'::jsonb,
  base_reward_ai JSONB NOT NULL DEFAULT '{"credits":0,"months":0,"ai_credits":500}'::jsonb,
  block_self_referral BOOLEAN NOT NULL DEFAULT true,
  max_referrals_per_ip_24h INT NOT NULL DEFAULT 3,
  auto_approve BOOLEAN NOT NULL DEFAULT true,
  require_subscription BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
INSERT INTO public.referral_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- 9. referral_fraud_log
CREATE TABLE IF NOT EXISTS public.referral_fraud_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_id UUID REFERENCES public.referrals(id) ON DELETE SET NULL,
  reason TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low','medium','high','critical')),
  ip_address TEXT,
  device_fingerprint TEXT,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Generate unique 8-char referral code
CREATE OR REPLACE FUNCTION public.generate_referral_code(_owner_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code TEXT;
  v_exists BOOLEAN;
  v_tries INT := 0;
BEGIN
  LOOP
    v_code := upper(substring(replace(encode(gen_random_bytes(6),'base64'),'/','X'), 1, 8));
    v_code := regexp_replace(v_code, '[^A-Z0-9]', 'M', 'g');
    SELECT EXISTS(SELECT 1 FROM public.referral_codes WHERE code = v_code) INTO v_exists;
    EXIT WHEN NOT v_exists OR v_tries > 10;
    v_tries := v_tries + 1;
  END LOOP;
  RETURN v_code;
END;
$$;

-- Ensure wallet exists
CREATE OR REPLACE FUNCTION public.ensure_referral_wallet(_owner_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.referral_wallet (owner_id) VALUES (_owner_id) ON CONFLICT (owner_id) DO NOTHING;
END;
$$;

-- Apply referral reward
CREATE OR REPLACE FUNCTION public.apply_referral_reward(_referral_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ref RECORD;
  v_settings RECORD;
  v_tier RECORD;
  v_base JSONB;
  v_credits NUMERIC := 0;
  v_months INT := 0;
  v_ai NUMERIC := 0;
  v_multiplier NUMERIC := 1.0;
  v_count INT;
  v_wallet_before NUMERIC;
BEGIN
  SELECT * INTO v_ref FROM public.referrals WHERE id = _referral_id;
  IF NOT FOUND OR v_ref.status = 'approved' THEN RETURN; END IF;

  SELECT * INTO v_settings FROM public.referral_settings WHERE id = 1;

  v_base := CASE
    WHEN COALESCE(v_ref.subscription_tier,'') ILIKE '%premium%' THEN v_settings.base_reward_premium
    WHEN COALESCE(v_ref.subscription_tier,'') ILIKE '%ai%' THEN v_settings.base_reward_ai
    ELSE v_settings.base_reward_basic
  END;

  -- Multiplier based on current tier
  SELECT COUNT(*) INTO v_count FROM public.referrals
    WHERE referrer_id = v_ref.referrer_id AND status IN ('subscribed','approved');
  SELECT * INTO v_tier FROM public.referral_tiers
    WHERE min_referrals <= v_count ORDER BY min_referrals DESC LIMIT 1;
  IF FOUND THEN v_multiplier := v_tier.bonus_multiplier; END IF;

  v_credits := COALESCE((v_base->>'credits')::numeric, 0) * v_multiplier;
  v_months  := FLOOR(COALESCE((v_base->>'months')::numeric, 0) * v_multiplier)::int;
  v_ai      := COALESCE((v_base->>'ai_credits')::numeric, 0) * v_multiplier;

  PERFORM public.ensure_referral_wallet(v_ref.referrer_id);

  -- Apply to wallet + ledger
  IF v_credits > 0 THEN
    SELECT credits_balance INTO v_wallet_before FROM public.referral_wallet WHERE owner_id = v_ref.referrer_id;
    UPDATE public.referral_wallet SET
      credits_balance = credits_balance + v_credits,
      lifetime_earned = lifetime_earned + v_credits,
      updated_at = now()
    WHERE owner_id = v_ref.referrer_id;
    INSERT INTO public.referral_rewards_ledger (user_id, referral_id, kind, amount, applied_to, balance_before, balance_after, notes)
    VALUES (v_ref.referrer_id, _referral_id, 'credits', v_credits, 'wallet', v_wallet_before, v_wallet_before + v_credits, 'Referral reward (credits)');
  END IF;

  IF v_months > 0 THEN
    SELECT months_balance INTO v_wallet_before FROM public.referral_wallet WHERE owner_id = v_ref.referrer_id;
    UPDATE public.referral_wallet SET
      months_balance = months_balance + v_months,
      updated_at = now()
    WHERE owner_id = v_ref.referrer_id;
    INSERT INTO public.referral_rewards_ledger (user_id, referral_id, kind, amount, applied_to, balance_before, balance_after, notes)
    VALUES (v_ref.referrer_id, _referral_id, 'months', v_months, 'wallet', v_wallet_before, v_wallet_before + v_months, 'Referral reward (bonus months)');
  END IF;

  IF v_ai > 0 THEN
    SELECT ai_credits_balance INTO v_wallet_before FROM public.referral_wallet WHERE owner_id = v_ref.referrer_id;
    UPDATE public.referral_wallet SET
      ai_credits_balance = ai_credits_balance + v_ai,
      lifetime_earned = lifetime_earned + v_ai,
      updated_at = now()
    WHERE owner_id = v_ref.referrer_id;
    INSERT INTO public.referral_rewards_ledger (user_id, referral_id, kind, amount, applied_to, balance_before, balance_after, notes)
    VALUES (v_ref.referrer_id, _referral_id, 'ai_credits', v_ai, 'wallet', v_wallet_before, v_wallet_before + v_ai, 'Referral reward (AI credits)');
  END IF;

  -- Update referral
  UPDATE public.referrals SET
    status = CASE WHEN v_settings.auto_approve THEN 'approved'::referral_status ELSE status END,
    approved_at = CASE WHEN v_settings.auto_approve THEN now() ELSE approved_at END,
    reward_credits = v_credits,
    reward_months = v_months,
    reward_ai_credits = v_ai,
    updated_at = now()
  WHERE id = _referral_id;

  -- Update code stats
  IF v_ref.code_id IS NOT NULL THEN
    UPDATE public.referral_codes SET
      total_uses = total_uses + 1,
      total_rewards_credits = total_rewards_credits + v_credits,
      total_rewards_months = total_rewards_months + v_months,
      updated_at = now()
    WHERE id = v_ref.code_id;
  END IF;

  -- Notify
  INSERT INTO public.referral_notifications (user_id, type, title, body, data) VALUES (
    v_ref.referrer_id, 'reward_granted',
    'Yangi referral bonusi!',
    'Sizning taklifingiz tasdiqlandi: +' || v_credits::text || ' credits, +' || v_months::text || ' oy',
    jsonb_build_object('referral_id', _referral_id, 'credits', v_credits, 'months', v_months, 'ai_credits', v_ai)
  );
END;
$$;

-- Trigger: when tenant_subscriptions inserted -> mark referral subscribed + apply
CREATE OR REPLACE FUNCTION public.trg_referral_on_subscription()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ref_id UUID;
BEGIN
  SELECT id INTO v_ref_id FROM public.referrals
    WHERE referred_user_id = NEW.owner_id AND status IN ('pending','registered')
    ORDER BY created_at ASC LIMIT 1;
  IF v_ref_id IS NULL THEN RETURN NEW; END IF;

  UPDATE public.referrals SET
    status = 'subscribed',
    subscribed_at = now(),
    subscription_tier = COALESCE(NEW.tier, subscription_tier),
    subscription_module = COALESCE(NEW.module_id, subscription_module),
    updated_at = now()
  WHERE id = v_ref_id;

  PERFORM public.apply_referral_reward(v_ref_id);
  RETURN NEW;
END;
$$;

-- Attach trigger if tenant_subscriptions exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='tenant_subscriptions') THEN
    DROP TRIGGER IF EXISTS trg_referral_subscription_apply ON public.tenant_subscriptions;
    CREATE TRIGGER trg_referral_subscription_apply
      AFTER INSERT ON public.tenant_subscriptions
      FOR EACH ROW EXECUTE FUNCTION public.trg_referral_on_subscription();
  END IF;
END $$;

-- Stats function
CREATE OR REPLACE FUNCTION public.get_referral_stats(_owner_id UUID)
RETURNS TABLE (
  total_invites INT,
  pending_count INT,
  subscribed_count INT,
  approved_count INT,
  conversion_rate NUMERIC,
  total_credits NUMERIC,
  total_months INT,
  total_ai_credits NUMERIC,
  current_tier TEXT,
  next_tier_min INT
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total INT;
  v_pending INT;
  v_sub INT;
  v_app INT;
  v_credits NUMERIC;
  v_months INT;
  v_ai NUMERIC;
  v_tier RECORD;
  v_next INT;
BEGIN
  SELECT COUNT(*) INTO v_total FROM public.referrals WHERE referrer_id = _owner_id;
  SELECT COUNT(*) INTO v_pending FROM public.referrals WHERE referrer_id = _owner_id AND status = 'pending';
  SELECT COUNT(*) INTO v_sub FROM public.referrals WHERE referrer_id = _owner_id AND status IN ('subscribed','approved');
  SELECT COUNT(*) INTO v_app FROM public.referrals WHERE referrer_id = _owner_id AND status = 'approved';

  SELECT COALESCE(SUM(reward_credits),0), COALESCE(SUM(reward_months),0), COALESCE(SUM(reward_ai_credits),0)
    INTO v_credits, v_months, v_ai
    FROM public.referrals WHERE referrer_id = _owner_id AND status IN ('subscribed','approved');

  SELECT * INTO v_tier FROM public.referral_tiers WHERE min_referrals <= v_sub ORDER BY min_referrals DESC LIMIT 1;
  SELECT min_referrals INTO v_next FROM public.referral_tiers WHERE min_referrals > v_sub ORDER BY min_referrals ASC LIMIT 1;

  RETURN QUERY SELECT
    v_total, v_pending, v_sub, v_app,
    CASE WHEN v_total > 0 THEN ROUND((v_sub::numeric / v_total::numeric) * 100, 1) ELSE 0 END,
    v_credits, v_months, v_ai,
    COALESCE(v_tier.display_name, 'Bronze'),
    COALESCE(v_next, 9999);
END;
$$;

-- Leaderboard view (anonymized)
CREATE OR REPLACE VIEW public.referral_leaderboard AS
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

-- updated_at triggers
CREATE TRIGGER trg_referral_codes_updated BEFORE UPDATE ON public.referral_codes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER trg_referrals_updated BEFORE UPDATE ON public.referrals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER trg_referral_promo_updated BEFORE UPDATE ON public.referral_promo_codes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER trg_referral_settings_updated BEFORE UPDATE ON public.referral_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================================================
-- RLS
-- ============================================================================

ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_rewards_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_wallet ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_fraud_log ENABLE ROW LEVEL SECURITY;

-- referral_codes
CREATE POLICY "owners read own codes" ON public.referral_codes FOR SELECT TO authenticated USING (auth.uid() = owner_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "owners insert own codes" ON public.referral_codes FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "owners update own codes" ON public.referral_codes FOR UPDATE TO authenticated USING (auth.uid() = owner_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin delete codes" ON public.referral_codes FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- referrals
CREATE POLICY "referrer or referred read" ON public.referrals FOR SELECT TO authenticated USING (auth.uid() = referrer_id OR auth.uid() = referred_user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "anyone insert referral" ON public.referrals FOR INSERT TO authenticated WITH CHECK (auth.uid() = referred_user_id OR auth.uid() = referrer_id);
CREATE POLICY "admin manage referrals" ON public.referrals FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- ledger
CREATE POLICY "user read own ledger" ON public.referral_rewards_ledger FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));

-- wallet
CREATE POLICY "owner read wallet" ON public.referral_wallet FOR SELECT TO authenticated USING (auth.uid() = owner_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "owner upsert wallet" ON public.referral_wallet FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "owner update wallet" ON public.referral_wallet FOR UPDATE TO authenticated USING (auth.uid() = owner_id OR public.has_role(auth.uid(),'admin'));

-- promo codes
CREATE POLICY "auth read active promo" ON public.referral_promo_codes FOR SELECT TO authenticated USING (is_active = true OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin manage promo" ON public.referral_promo_codes FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- tiers
CREATE POLICY "auth read tiers" ON public.referral_tiers FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin manage tiers" ON public.referral_tiers FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- notifications
CREATE POLICY "user read own notif" ON public.referral_notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "user update own notif" ON public.referral_notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- settings
CREATE POLICY "auth read settings" ON public.referral_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin manage settings" ON public.referral_settings FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- fraud log
CREATE POLICY "admin read fraud" ON public.referral_fraud_log FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.referrals;
ALTER PUBLICATION supabase_realtime ADD TABLE public.referral_notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.referral_wallet;
