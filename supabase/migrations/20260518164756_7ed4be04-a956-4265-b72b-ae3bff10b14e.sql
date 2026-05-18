
-- Referral attach trigger: on new auth user, if raw_user_meta_data.referral_code matches an active code,
-- create a referrals row with status='registered' and refresh the code's stats.

CREATE OR REPLACE FUNCTION public.handle_new_user_referral()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code_text TEXT;
  v_code public.referral_codes%ROWTYPE;
  v_email TEXT;
  v_source TEXT;
  v_existing UUID;
BEGIN
  v_code_text := UPPER(NULLIF(TRIM(NEW.raw_user_meta_data->>'referral_code'), ''));
  IF v_code_text IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT * INTO v_code FROM public.referral_codes
    WHERE code = v_code_text AND is_active = true
    LIMIT 1;

  IF NOT FOUND THEN
    RETURN NEW;
  END IF;

  -- block self-referral
  IF v_code.owner_id = NEW.id THEN
    INSERT INTO public.referral_fraud_log(referral_id, kind, severity, notes)
    VALUES (NULL, 'self_referral', 'low', 'Self-referral attempt at signup blocked');
    RETURN NEW;
  END IF;

  -- prevent duplicate per referred user
  SELECT id INTO v_existing FROM public.referrals
    WHERE referred_user_id = NEW.id LIMIT 1;
  IF v_existing IS NOT NULL THEN
    RETURN NEW;
  END IF;

  v_email := NEW.email;
  v_source := NEW.raw_user_meta_data->>'referral_source';

  INSERT INTO public.referrals(
    code_id, code_text, referrer_id, referred_user_id, referred_email,
    referred_org_role, status, registered_at, meta
  ) VALUES (
    v_code.id, v_code.code, v_code.owner_id, NEW.id, v_email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'patient'),
    'registered', now(),
    jsonb_build_object(
      'source', v_source,
      'captured_at', NEW.raw_user_meta_data->>'referral_captured_at'
    )
  );

  -- bump code counters
  UPDATE public.referral_codes
    SET total_clicks = total_clicks + 1,
        total_signups = total_signups + 1,
        updated_at = now()
    WHERE id = v_code.id;

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.handle_new_user_referral() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_handle_new_user_referral ON auth.users;
CREATE TRIGGER trg_handle_new_user_referral
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_referral();
