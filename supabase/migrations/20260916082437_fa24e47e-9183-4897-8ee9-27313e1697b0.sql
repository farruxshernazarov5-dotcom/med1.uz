CREATE OR REPLACE FUNCTION public.claim_initial_role(_role text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_cnt int;
  v_current text;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  IF _role NOT IN ('patient','doctor','clinic','diagnostics','vendor','maternity','cosmetology','pharmacy','dental','bloodbank') THEN
    RAISE EXCEPTION 'invalid_role';
  END IF;

  SELECT count(*), min(role::text) INTO v_cnt, v_current
  FROM public.user_roles WHERE user_id = v_uid;

  IF v_cnt = 0 THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (v_uid, _role::app_role);
    RETURN _role;
  END IF;

  IF v_cnt = 1 AND v_current = 'patient' AND _role <> 'patient' THEN
    IF EXISTS (SELECT 1 FROM auth.users WHERE id = v_uid AND created_at > now() - interval '7 days') THEN
      UPDATE public.user_roles SET role = _role::app_role WHERE user_id = v_uid;
      RETURN _role;
    END IF;
  END IF;

  RETURN v_current;
END;
$$;

GRANT EXECUTE ON FUNCTION public.claim_initial_role(text) TO authenticated;