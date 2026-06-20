
-- deduct_ai_credits'ni kengaytirish (channel va model bilan)
CREATE OR REPLACE FUNCTION public.deduct_ai_credits(
  _user_id uuid,
  _service_id text,
  _cost integer,
  _channel text DEFAULT 'web',
  _model text DEFAULT NULL
)
RETURNS TABLE(success boolean, balance_after integer, error text, usage_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_total integer := 0;
  v_remaining integer;
  v_credit record;
  v_usage_id uuid;
BEGIN
  PERFORM 1 FROM public.user_credits
    WHERE user_id = _user_id AND expires_at > now() AND balance > 0
    FOR UPDATE;

  SELECT COALESCE(SUM(balance), 0) INTO v_total
    FROM public.user_credits
    WHERE user_id = _user_id AND expires_at > now() AND balance > 0;

  IF v_total < _cost THEN
    RETURN QUERY SELECT false, v_total, format('Kredit yetarli emas. Kerak: %s, balans: %s', _cost, v_total), NULL::uuid;
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

  INSERT INTO public.ai_usage(user_id, service_id, usage_date, channel, model, cost_credits, status)
  VALUES (_user_id, _service_id, (now())::date, _channel, _model, _cost, 'success')
  RETURNING id INTO v_usage_id;

  RETURN QUERY SELECT true, v_total - _cost, NULL::text, v_usage_id;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.deduct_ai_credits(uuid, text, integer, text, text) TO authenticated, service_role;

-- Natija (latency, tokens, status) yangilanishi
CREATE OR REPLACE FUNCTION public.update_ai_usage_result(
  _usage_id uuid,
  _status text DEFAULT NULL,
  _latency_ms integer DEFAULT NULL,
  _prompt_tokens integer DEFAULT NULL,
  _completion_tokens integer DEFAULT NULL,
  _tokens_used integer DEFAULT NULL,
  _cost_usd numeric DEFAULT NULL,
  _error_code text DEFAULT NULL,
  _error_message text DEFAULT NULL,
  _region text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF _usage_id IS NULL THEN RETURN; END IF;
  UPDATE public.ai_usage
  SET
    status            = COALESCE(_status, status),
    latency_ms        = COALESCE(_latency_ms, latency_ms),
    prompt_tokens     = COALESCE(_prompt_tokens, prompt_tokens),
    completion_tokens = COALESCE(_completion_tokens, completion_tokens),
    tokens_used       = COALESCE(_tokens_used, tokens_used),
    cost_usd          = COALESCE(_cost_usd, cost_usd),
    error_code        = COALESCE(_error_code, error_code),
    error_message     = COALESCE(_error_message, error_message),
    region            = COALESCE(_region, region)
  WHERE id = _usage_id;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.update_ai_usage_result(uuid, text, integer, integer, integer, integer, numeric, text, text, text) TO authenticated, service_role;
