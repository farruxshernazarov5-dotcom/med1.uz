
-- 1) Add configurable rules
ALTER TABLE public.referral_settings
  ADD COLUMN IF NOT EXISTS min_subscription_amount numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS qualify_within_days integer NOT NULL DEFAULT 30,
  ADD COLUMN IF NOT EXISTS reward_hold_days integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cancel_on_refund boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS cancel_on_unsubscribe_days integer NOT NULL DEFAULT 0;

-- 2) Add 'expired' and 'cancelled' to referral_status enum
DO $$ BEGIN
  ALTER TYPE referral_status ADD VALUE IF NOT EXISTS 'expired';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TYPE referral_status ADD VALUE IF NOT EXISTS 'cancelled';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 3) Add cancellation tracking columns to referrals
ALTER TABLE public.referrals
  ADD COLUMN IF NOT EXISTS hold_until timestamp with time zone,
  ADD COLUMN IF NOT EXISTS cancelled_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS cancelled_reason text,
  ADD COLUMN IF NOT EXISTS subscription_amount numeric DEFAULT 0;

-- 4) Update apply_referral_reward to enforce min amount, time limit, and hold
CREATE OR REPLACE FUNCTION public.apply_referral_reward(_referral_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
  v_age_days NUMERIC;
  v_status_target referral_status;
  v_hold_until TIMESTAMPTZ;
BEGIN
  SELECT * INTO v_ref FROM public.referrals WHERE id = _referral_id;
  IF NOT FOUND OR v_ref.status IN ('approved','cancelled','expired','rejected') THEN RETURN; END IF;

  SELECT * INTO v_settings FROM public.referral_settings WHERE id = 1;

  -- ENFORCE: qualify_within_days (registered_at -> subscribed_at)
  IF v_settings.qualify_within_days > 0 AND v_ref.registered_at IS NOT NULL AND v_ref.subscribed_at IS NOT NULL THEN
    v_age_days := EXTRACT(EPOCH FROM (v_ref.subscribed_at - v_ref.registered_at)) / 86400.0;
    IF v_age_days > v_settings.qualify_within_days THEN
      UPDATE public.referrals SET
        status = 'expired',
        cancelled_reason = 'qualify_within_days exceeded (' || ROUND(v_age_days,1) || 'd > ' || v_settings.qualify_within_days || 'd)',
        cancelled_at = now(),
        updated_at = now()
      WHERE id = _referral_id;
      INSERT INTO public.referral_notifications (user_id, type, title, body, data)
      VALUES (v_ref.referrer_id, 'reward_expired', 'Referral muddati o''tdi',
              'Taklif qilingan foydalanuvchi belgilangan muddatda obuna bo''lmadi', jsonb_build_object('referral_id', _referral_id));
      RETURN;
    END IF;
  END IF;

  -- ENFORCE: min_subscription_amount
  IF COALESCE(v_settings.min_subscription_amount,0) > 0
     AND COALESCE(v_ref.subscription_amount,0) < v_settings.min_subscription_amount THEN
    UPDATE public.referrals SET
      cancelled_reason = 'subscription_amount ' || COALESCE(v_ref.subscription_amount,0) || ' < min ' || v_settings.min_subscription_amount,
      updated_at = now()
    WHERE id = _referral_id;
    RETURN;
  END IF;

  v_base := CASE
    WHEN COALESCE(v_ref.subscription_tier,'') ILIKE '%premium%' THEN v_settings.base_reward_premium
    WHEN COALESCE(v_ref.subscription_tier,'') ILIKE '%ai%' THEN v_settings.base_reward_ai
    ELSE v_settings.base_reward_basic
  END;

  SELECT COUNT(*) INTO v_count FROM public.referrals
    WHERE referrer_id = v_ref.referrer_id AND status IN ('subscribed','approved');
  SELECT * INTO v_tier FROM public.referral_tiers
    WHERE min_referrals <= v_count ORDER BY min_referrals DESC LIMIT 1;
  IF FOUND THEN v_multiplier := v_tier.bonus_multiplier; END IF;

  v_credits := COALESCE((v_base->>'credits')::numeric, 0) * v_multiplier;
  v_months  := FLOOR(COALESCE((v_base->>'months')::numeric, 0) * v_multiplier)::int;
  v_ai      := COALESCE((v_base->>'ai_credits')::numeric, 0) * v_multiplier;

  PERFORM public.ensure_referral_wallet(v_ref.referrer_id);

  -- Determine target status based on hold window
  IF v_settings.reward_hold_days > 0 THEN
    v_hold_until := now() + (v_settings.reward_hold_days || ' days')::interval;
    v_status_target := 'subscribed'::referral_status; -- stays in subscribed (held)
  ELSE
    v_hold_until := NULL;
    v_status_target := CASE WHEN v_settings.auto_approve THEN 'approved'::referral_status ELSE v_ref.status END;
  END IF;

  -- Apply to wallet only if not held
  IF v_settings.reward_hold_days = 0 THEN
    IF v_credits > 0 THEN
      SELECT credits_balance INTO v_wallet_before FROM public.referral_wallet WHERE owner_id = v_ref.referrer_id;
      UPDATE public.referral_wallet SET credits_balance = credits_balance + v_credits, lifetime_earned = lifetime_earned + v_credits, updated_at = now() WHERE owner_id = v_ref.referrer_id;
      INSERT INTO public.referral_rewards_ledger (user_id, referral_id, kind, amount, applied_to, balance_before, balance_after, notes)
      VALUES (v_ref.referrer_id, _referral_id, 'credits', v_credits, 'wallet', v_wallet_before, v_wallet_before + v_credits, 'Referral reward (credits)');
    END IF;
    IF v_months > 0 THEN
      SELECT months_balance INTO v_wallet_before FROM public.referral_wallet WHERE owner_id = v_ref.referrer_id;
      UPDATE public.referral_wallet SET months_balance = months_balance + v_months, updated_at = now() WHERE owner_id = v_ref.referrer_id;
      INSERT INTO public.referral_rewards_ledger (user_id, referral_id, kind, amount, applied_to, balance_before, balance_after, notes)
      VALUES (v_ref.referrer_id, _referral_id, 'months', v_months, 'wallet', v_wallet_before, v_wallet_before + v_months, 'Referral reward (bonus months)');
    END IF;
    IF v_ai > 0 THEN
      SELECT ai_credits_balance INTO v_wallet_before FROM public.referral_wallet WHERE owner_id = v_ref.referrer_id;
      UPDATE public.referral_wallet SET ai_credits_balance = ai_credits_balance + v_ai, lifetime_earned = lifetime_earned + v_ai, updated_at = now() WHERE owner_id = v_ref.referrer_id;
      INSERT INTO public.referral_rewards_ledger (user_id, referral_id, kind, amount, applied_to, balance_before, balance_after, notes)
      VALUES (v_ref.referrer_id, _referral_id, 'ai_credits', v_ai, 'wallet', v_wallet_before, v_wallet_before + v_ai, 'Referral reward (AI credits)');
    END IF;
  END IF;

  UPDATE public.referrals SET
    status = v_status_target,
    approved_at = CASE WHEN v_status_target = 'approved' THEN now() ELSE approved_at END,
    hold_until = v_hold_until,
    reward_credits = v_credits,
    reward_months = v_months,
    reward_ai_credits = v_ai,
    updated_at = now()
  WHERE id = _referral_id;

  IF v_ref.code_id IS NOT NULL AND v_status_target = 'approved' THEN
    UPDATE public.referral_codes SET
      total_uses = total_uses + 1,
      total_rewards_credits = total_rewards_credits + v_credits,
      total_rewards_months = total_rewards_months + v_months,
      updated_at = now()
    WHERE id = v_ref.code_id;
  END IF;

  INSERT INTO public.referral_notifications (user_id, type, title, body, data) VALUES (
    v_ref.referrer_id,
    CASE WHEN v_status_target = 'approved' THEN 'reward_granted' ELSE 'reward_held' END,
    CASE WHEN v_status_target = 'approved' THEN 'Yangi referral bonusi!' ELSE 'Bonus ushlab turilmoqda' END,
    CASE WHEN v_status_target = 'approved'
      THEN 'Sizning taklifingiz tasdiqlandi: +' || v_credits::text || ' credits, +' || v_months::text || ' oy'
      ELSE 'Bonus ' || v_settings.reward_hold_days || ' kunlik hold ostida — keyin avtomatik faollashadi'
    END,
    jsonb_build_object('referral_id', _referral_id, 'credits', v_credits, 'months', v_months, 'ai_credits', v_ai, 'hold_until', v_hold_until)
  );
END;
$function$;

-- 5) Revoke a referral reward (refund / chargeback / manual cancel)
CREATE OR REPLACE FUNCTION public.revoke_referral_reward(_referral_id uuid, _reason text DEFAULT 'manual_cancel')
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_ref RECORD;
  v_wallet_before NUMERIC;
BEGIN
  SELECT * INTO v_ref FROM public.referrals WHERE id = _referral_id;
  IF NOT FOUND OR v_ref.status = 'cancelled' THEN RETURN; END IF;

  -- Reverse wallet if reward was actually paid (status = approved or had hold released)
  IF v_ref.status = 'approved' THEN
    IF v_ref.reward_credits > 0 THEN
      SELECT credits_balance INTO v_wallet_before FROM public.referral_wallet WHERE owner_id = v_ref.referrer_id;
      UPDATE public.referral_wallet SET credits_balance = GREATEST(0, credits_balance - v_ref.reward_credits), updated_at = now() WHERE owner_id = v_ref.referrer_id;
      INSERT INTO public.referral_rewards_ledger (user_id, referral_id, kind, amount, applied_to, balance_before, balance_after, notes)
      VALUES (v_ref.referrer_id, _referral_id, 'credits', -v_ref.reward_credits, 'wallet', v_wallet_before, GREATEST(0, v_wallet_before - v_ref.reward_credits), 'Revoke: ' || _reason);
    END IF;
    IF v_ref.reward_months > 0 THEN
      SELECT months_balance INTO v_wallet_before FROM public.referral_wallet WHERE owner_id = v_ref.referrer_id;
      UPDATE public.referral_wallet SET months_balance = GREATEST(0, months_balance - v_ref.reward_months), updated_at = now() WHERE owner_id = v_ref.referrer_id;
      INSERT INTO public.referral_rewards_ledger (user_id, referral_id, kind, amount, applied_to, balance_before, balance_after, notes)
      VALUES (v_ref.referrer_id, _referral_id, 'months', -v_ref.reward_months, 'wallet', v_wallet_before, GREATEST(0, v_wallet_before - v_ref.reward_months), 'Revoke: ' || _reason);
    END IF;
    IF v_ref.reward_ai_credits > 0 THEN
      SELECT ai_credits_balance INTO v_wallet_before FROM public.referral_wallet WHERE owner_id = v_ref.referrer_id;
      UPDATE public.referral_wallet SET ai_credits_balance = GREATEST(0, ai_credits_balance - v_ref.reward_ai_credits), updated_at = now() WHERE owner_id = v_ref.referrer_id;
      INSERT INTO public.referral_rewards_ledger (user_id, referral_id, kind, amount, applied_to, balance_before, balance_after, notes)
      VALUES (v_ref.referrer_id, _referral_id, 'ai_credits', -v_ref.reward_ai_credits, 'wallet', v_wallet_before, GREATEST(0, v_wallet_before - v_ref.reward_ai_credits), 'Revoke: ' || _reason);
    END IF;
  END IF;

  UPDATE public.referrals SET
    status = 'cancelled',
    cancelled_at = now(),
    cancelled_reason = _reason,
    updated_at = now()
  WHERE id = _referral_id;

  INSERT INTO public.referral_notifications (user_id, type, title, body, data) VALUES (
    v_ref.referrer_id, 'reward_revoked',
    'Referral bonusi bekor qilindi',
    'Sabab: ' || _reason,
    jsonb_build_object('referral_id', _referral_id, 'reason', _reason)
  );

  -- Log to fraud table for audit
  INSERT INTO public.referral_fraud_log(referral_id, kind, severity, notes)
  VALUES (_referral_id, 'reward_revoked', 'medium', 'Reason: ' || _reason);
END;
$function$;

-- 6) Release held referrals whose hold window expired (call from cron / admin)
CREATE OR REPLACE FUNCTION public.release_held_referral_rewards()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  r RECORD;
  v_count INT := 0;
  v_wallet_before NUMERIC;
BEGIN
  FOR r IN
    SELECT * FROM public.referrals
    WHERE status = 'subscribed' AND hold_until IS NOT NULL AND hold_until <= now()
  LOOP
    IF r.reward_credits > 0 THEN
      SELECT credits_balance INTO v_wallet_before FROM public.referral_wallet WHERE owner_id = r.referrer_id;
      UPDATE public.referral_wallet SET credits_balance = credits_balance + r.reward_credits, lifetime_earned = lifetime_earned + r.reward_credits, updated_at = now() WHERE owner_id = r.referrer_id;
      INSERT INTO public.referral_rewards_ledger (user_id, referral_id, kind, amount, applied_to, balance_before, balance_after, notes)
      VALUES (r.referrer_id, r.id, 'credits', r.reward_credits, 'wallet', v_wallet_before, v_wallet_before + r.reward_credits, 'Hold released');
    END IF;
    IF r.reward_months > 0 THEN
      SELECT months_balance INTO v_wallet_before FROM public.referral_wallet WHERE owner_id = r.referrer_id;
      UPDATE public.referral_wallet SET months_balance = months_balance + r.reward_months, updated_at = now() WHERE owner_id = r.referrer_id;
      INSERT INTO public.referral_rewards_ledger (user_id, referral_id, kind, amount, applied_to, balance_before, balance_after, notes)
      VALUES (r.referrer_id, r.id, 'months', r.reward_months, 'wallet', v_wallet_before, v_wallet_before + r.reward_months, 'Hold released');
    END IF;
    IF r.reward_ai_credits > 0 THEN
      SELECT ai_credits_balance INTO v_wallet_before FROM public.referral_wallet WHERE owner_id = r.referrer_id;
      UPDATE public.referral_wallet SET ai_credits_balance = ai_credits_balance + r.reward_ai_credits, lifetime_earned = lifetime_earned + r.reward_ai_credits, updated_at = now() WHERE owner_id = r.referrer_id;
      INSERT INTO public.referral_rewards_ledger (user_id, referral_id, kind, amount, applied_to, balance_before, balance_after, notes)
      VALUES (r.referrer_id, r.id, 'ai_credits', r.reward_ai_credits, 'wallet', v_wallet_before, v_wallet_before + r.reward_ai_credits, 'Hold released');
    END IF;

    UPDATE public.referrals SET status = 'approved', approved_at = now(), updated_at = now() WHERE id = r.id;
    v_count := v_count + 1;

    INSERT INTO public.referral_notifications (user_id, type, title, body, data) VALUES (
      r.referrer_id, 'reward_released', 'Bonus faollashtirildi',
      'Hold muddati tugadi — bonus hamyoningizga qo''shildi', jsonb_build_object('referral_id', r.id));
  END LOOP;
  RETURN v_count;
END;
$function$;
