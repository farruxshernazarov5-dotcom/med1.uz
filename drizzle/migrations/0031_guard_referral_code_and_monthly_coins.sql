CREATE OR REPLACE FUNCTION public.ensure_referral_code(_owner_id uuid, _kind text DEFAULT 'patient'::text, _org_role text DEFAULT NULL::text)
 RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE v_existing TEXT; v_new TEXT;
BEGIN
  IF auth.role() <> 'service_role' AND auth.uid() IS DISTINCT FROM _owner_id AND NOT public.has_role(auth.uid(),'admin') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  SELECT code INTO v_existing FROM public.referral_codes
    WHERE owner_id = _owner_id AND is_active = true AND code IS NOT NULL AND code <> '' LIMIT 1;
  IF v_existing IS NOT NULL THEN RETURN v_existing; END IF;
  DELETE FROM public.referral_codes WHERE owner_id = _owner_id AND (code IS NULL OR code = '');
  v_new := public.generate_referral_code(_owner_id);
  INSERT INTO public.referral_codes (owner_id, code, kind, org_role, is_active)
  VALUES (_owner_id, v_new, COALESCE(_kind,'patient'), _org_role, true)
  ON CONFLICT (code) DO NOTHING;
  SELECT code INTO v_existing FROM public.referral_codes WHERE owner_id = _owner_id AND is_active = true LIMIT 1;
  RETURN v_existing;
END;
$function$;

CREATE OR REPLACE FUNCTION public.grant_monthly_free_coins(_user_id uuid)
 RETURNS TABLE(granted boolean, amount integer, balance_after integer, next_grant_at timestamp with time zone)
 LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  v_month_key text := to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM');
  v_desc text := 'monthly_free_grant_' || v_month_key;
  v_already boolean;
  v_expires timestamptz := (date_trunc('month', now() AT TIME ZONE 'UTC') + interval '1 month')::timestamptz;
  v_next timestamptz := v_expires;
  v_total integer;
BEGIN
  IF _user_id IS NULL THEN RETURN QUERY SELECT false, 0, 0, v_next; RETURN; END IF;
  IF auth.role() <> 'service_role' AND auth.uid() IS DISTINCT FROM _user_id THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  SELECT EXISTS(SELECT 1 FROM public.credit_history WHERE user_id = _user_id AND type = 'monthly_grant' AND description = v_desc) INTO v_already;
  IF v_already THEN
    SELECT COALESCE(SUM(balance),0) INTO v_total FROM public.user_credits WHERE user_id = _user_id AND expires_at > now() AND balance > 0;
    RETURN QUERY SELECT false, 0, v_total, v_next; RETURN;
  END IF;
  INSERT INTO public.user_credits(user_id, balance, purchased_at, expires_at, package_name)
  VALUES (_user_id, 2, now(), v_expires, 'monthly_free_grant');
  SELECT COALESCE(SUM(balance),0) INTO v_total FROM public.user_credits WHERE user_id = _user_id AND expires_at > now() AND balance > 0;
  INSERT INTO public.credit_history(user_id, amount, type, service_id, description, balance_after)
  VALUES (_user_id, 2, 'monthly_grant', NULL, v_desc, v_total);
  RETURN QUERY SELECT true, 2, v_total, v_next;
END;
$function$;
REVOKE ALL ON FUNCTION public.grant_monthly_free_coins(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.ensure_referral_code(uuid,text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.grant_monthly_free_coins(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.ensure_referral_code(uuid,text,text) TO authenticated, service_role;