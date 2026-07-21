
CREATE OR REPLACE FUNCTION public.grant_monthly_free_coins(_user_id uuid)
RETURNS TABLE(granted boolean, amount integer, balance_after integer, next_grant_at timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_month_key text := to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM');
  v_desc text := 'monthly_free_grant_' || v_month_key;
  v_already boolean;
  v_expires timestamptz := (date_trunc('month', now() AT TIME ZONE 'UTC') + interval '1 month')::timestamptz;
  v_next timestamptz := v_expires;
  v_total integer;
BEGIN
  IF _user_id IS NULL THEN
    RETURN QUERY SELECT false, 0, 0, v_next;
    RETURN;
  END IF;

  SELECT EXISTS(
    SELECT 1 FROM public.credit_history
    WHERE user_id = _user_id AND type = 'monthly_grant' AND description = v_desc
  ) INTO v_already;

  IF v_already THEN
    SELECT COALESCE(SUM(balance),0) INTO v_total FROM public.user_credits
      WHERE user_id = _user_id AND expires_at > now() AND balance > 0;
    RETURN QUERY SELECT false, 0, v_total, v_next;
    RETURN;
  END IF;

  INSERT INTO public.user_credits(user_id, balance, purchased_at, expires_at, package_name)
  VALUES (_user_id, 2, now(), v_expires, 'monthly_free_grant');

  SELECT COALESCE(SUM(balance),0) INTO v_total FROM public.user_credits
    WHERE user_id = _user_id AND expires_at > now() AND balance > 0;

  INSERT INTO public.credit_history(user_id, amount, type, service_id, description, balance_after)
  VALUES (_user_id, 2, 'monthly_grant', NULL, v_desc, v_total);

  RETURN QUERY SELECT true, 2, v_total, v_next;
END;
$$;

REVOKE ALL ON FUNCTION public.grant_monthly_free_coins(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.grant_monthly_free_coins(uuid) TO authenticated, service_role;
