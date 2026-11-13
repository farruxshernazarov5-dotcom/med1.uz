CREATE OR REPLACE FUNCTION public.ensure_referral_code(_owner_id uuid, _kind text DEFAULT 'patient'::text, _org_role text DEFAULT NULL::text)
 RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE v_existing TEXT; v_new TEXT;
BEGIN
  -- Signup trigger / service paths run without a user id; signed-in callers may only act on themselves (or be admin).
  IF auth.uid() IS NOT NULL AND auth.uid() <> _owner_id AND NOT public.has_role(auth.uid(),'admin') THEN
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