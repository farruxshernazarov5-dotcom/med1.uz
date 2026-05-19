
-- Fix generate_referral_code: gen_random_bytes (pgcrypto) is unavailable.
-- Use gen_random_uuid() + md5 to produce a unique 8-char alphanumeric code.
CREATE OR REPLACE FUNCTION public.generate_referral_code(_owner_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_code TEXT;
  v_exists BOOLEAN;
  v_tries INT := 0;
BEGIN
  LOOP
    -- 8-char A-Z0-9 code from md5(random uuid + owner)
    v_code := upper(substring(
      regexp_replace(md5(gen_random_uuid()::text || COALESCE(_owner_id::text,'') || clock_timestamp()::text), '[^a-z0-9]', '', 'g'),
      1, 8
    ));
    -- Make sure it's all alnum and length 8
    IF length(v_code) < 8 THEN
      v_code := rpad(v_code, 8, 'M');
    END IF;
    SELECT EXISTS(SELECT 1 FROM public.referral_codes WHERE code = v_code) INTO v_exists;
    EXIT WHEN NOT v_exists OR v_tries > 20;
    v_tries := v_tries + 1;
  END LOOP;
  RETURN v_code;
END;
$function$;

-- Helper: ensure a referral code exists for a given user
CREATE OR REPLACE FUNCTION public.ensure_referral_code(_owner_id uuid, _kind text DEFAULT 'patient', _org_role text DEFAULT NULL)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_existing TEXT;
  v_new TEXT;
BEGIN
  SELECT code INTO v_existing FROM public.referral_codes
    WHERE owner_id = _owner_id AND is_active = true AND code IS NOT NULL AND code <> ''
    LIMIT 1;
  IF v_existing IS NOT NULL THEN
    RETURN v_existing;
  END IF;

  -- Clean up any broken (empty-code) rows for this user
  DELETE FROM public.referral_codes WHERE owner_id = _owner_id AND (code IS NULL OR code = '');

  v_new := public.generate_referral_code(_owner_id);
  INSERT INTO public.referral_codes (owner_id, code, kind, org_role, is_active)
  VALUES (_owner_id, v_new, COALESCE(_kind,'patient'), _org_role, true)
  ON CONFLICT (code) DO NOTHING;

  -- Re-read in case of race
  SELECT code INTO v_existing FROM public.referral_codes
    WHERE owner_id = _owner_id AND is_active = true LIMIT 1;
  RETURN v_existing;
END;
$function$;

-- Extend handle_new_user so every new signup gets a referral code automatically
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_role TEXT;
BEGIN
  INSERT INTO public.profiles (user_id, full_name, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', '')
  );

  v_role := COALESCE(NEW.raw_user_meta_data->>'role', 'patient');
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, v_role::app_role);

  -- Auto-generate a unique referral code for this user
  PERFORM public.ensure_referral_code(
    NEW.id,
    CASE WHEN v_role = 'patient' THEN 'patient' ELSE 'org' END,
    v_role
  );

  -- Ensure wallet exists
  PERFORM public.ensure_referral_wallet(NEW.id);

  RETURN NEW;
END;
$function$;

-- Backfill: generate codes for every existing user (profiles) that has none
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT p.user_id,
           COALESCE((SELECT role::text FROM public.user_roles WHERE user_id = p.user_id LIMIT 1), 'patient') AS role
    FROM public.profiles p
    WHERE NOT EXISTS (
      SELECT 1 FROM public.referral_codes rc
      WHERE rc.owner_id = p.user_id AND rc.is_active = true AND rc.code IS NOT NULL AND rc.code <> ''
    )
  LOOP
    PERFORM public.ensure_referral_code(
      r.user_id,
      CASE WHEN r.role = 'patient' THEN 'patient' ELSE 'org' END,
      r.role
    );
    PERFORM public.ensure_referral_wallet(r.user_id);
  END LOOP;
END $$;
