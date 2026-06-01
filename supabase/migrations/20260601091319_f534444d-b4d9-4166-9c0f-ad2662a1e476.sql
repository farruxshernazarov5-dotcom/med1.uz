
-- Atomic credit deduction (FIFO by expiry, locks rows)
CREATE OR REPLACE FUNCTION public.deduct_ai_credits(_user_id uuid, _service_id text, _cost integer)
RETURNS TABLE(success boolean, balance_after integer, error text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total integer := 0;
  v_remaining integer;
  v_credit record;
BEGIN
  -- Lock all active credit rows for this user (serializes concurrent calls)
  PERFORM 1 FROM public.user_credits
    WHERE user_id = _user_id AND expires_at > now() AND balance > 0
    FOR UPDATE;

  SELECT COALESCE(SUM(balance), 0) INTO v_total
    FROM public.user_credits
    WHERE user_id = _user_id AND expires_at > now() AND balance > 0;

  IF v_total < _cost THEN
    RETURN QUERY SELECT false, v_total, format('Kredit yetarli emas. Kerak: %s, balans: %s', _cost, v_total);
    RETURN;
  END IF;

  v_remaining := _cost;
  FOR v_credit IN
    SELECT id, balance FROM public.user_credits
    WHERE user_id = _user_id AND expires_at > now() AND balance > 0
    ORDER BY expires_at ASC
  LOOP
    EXIT WHEN v_remaining <= 0;
    IF v_credit.balance >= v_remaining THEN
      UPDATE public.user_credits SET balance = balance - v_remaining, updated_at = now() WHERE id = v_credit.id;
      v_remaining := 0;
    ELSE
      v_remaining := v_remaining - v_credit.balance;
      UPDATE public.user_credits SET balance = 0, updated_at = now() WHERE id = v_credit.id;
    END IF;
  END LOOP;

  INSERT INTO public.credit_history(user_id, amount, type, service_id, description, balance_after)
  VALUES (_user_id, -_cost, 'deduct', _service_id, _service_id || ' xizmatidan foydalanish', v_total - _cost);

  INSERT INTO public.ai_usage(user_id, service_id, usage_date)
  VALUES (_user_id, _service_id, (now())::date);

  RETURN QUERY SELECT true, v_total - _cost, NULL::text;
END;
$$;

-- Refund credits on AI failure (adds back to nearest-expiring active bucket; if none, creates 30-day bucket)
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

  -- Remove the most recent usage entry for this service today (best-effort)
  DELETE FROM public.ai_usage
    WHERE id IN (
      SELECT id FROM public.ai_usage
      WHERE user_id = _user_id AND service_id = _service_id AND created_at > now() - interval '5 minutes'
      ORDER BY created_at DESC LIMIT 1
    );

  INSERT INTO public.credit_history(user_id, amount, type, service_id, description, balance_after)
  VALUES (_user_id, _cost, 'refund', _service_id, 'Refund: ' || _reason, v_new_balance);

  RETURN v_new_balance;
END;
$$;

GRANT EXECUTE ON FUNCTION public.deduct_ai_credits(uuid, text, integer) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.refund_ai_credits(uuid, text, integer, text) TO authenticated, service_role;
