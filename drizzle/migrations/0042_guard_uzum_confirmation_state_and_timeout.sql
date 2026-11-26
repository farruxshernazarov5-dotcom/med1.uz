ALTER FUNCTION public.uzum_payment_transition(text, uuid, uuid, bigint, bigint, bigint, text)
RENAME TO uzum_payment_transition_v1;

REVOKE ALL ON FUNCTION public.uzum_payment_transition_v1(text, uuid, uuid, bigint, bigint, bigint, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.uzum_payment_transition_v1(text, uuid, uuid, bigint, bigint, bigint, text) TO service_role;

CREATE FUNCTION public.uzum_payment_transition(
  _action text,
  _trans_id uuid,
  _payment_id uuid DEFAULT NULL,
  _service_id bigint DEFAULT NULL,
  _amount_tiyin bigint DEFAULT NULL,
  _event_time bigint DEFAULT NULL,
  _payment_source text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_state record;
  result jsonb;
BEGIN
  IF _action = 'confirm' THEN
    SELECT
      t.status AS transaction_status,
      t.trans_time AS transaction_time,
      p.status AS payment_status
    INTO current_state
    FROM public.uzum_transactions t
    JOIN public.platform_payments p ON p.id = t.payment_id
    WHERE t.trans_id = _trans_id AND t.service_id = _service_id
    FOR UPDATE OF t, p;

    IF FOUND AND current_state.transaction_status = 'CREATED' THEN
      IF current_state.payment_status IN ('paid', 'completed') THEN
        RETURN jsonb_build_object('ok', false, 'error_code', '10016');
      END IF;
      IF current_state.payment_status <> 'pending' THEN
        RETURN jsonb_build_object('ok', false, 'error_code', '10015');
      END IF;
      IF _event_time - current_state.transaction_time > 1800000 THEN
        result := public.uzum_payment_transition_v1(
          'reverse', _trans_id, NULL, _service_id, NULL, _event_time, NULL
        );
        IF COALESCE((result->>'ok')::boolean, false) THEN
          RETURN jsonb_build_object('ok', false, 'error_code', '10015');
        END IF;
        RETURN result;
      END IF;
    END IF;
  END IF;

  RETURN public.uzum_payment_transition_v1(
    _action, _trans_id, _payment_id, _service_id,
    _amount_tiyin, _event_time, _payment_source
  );
END;
$$;

REVOKE ALL ON FUNCTION public.uzum_payment_transition(text, uuid, uuid, bigint, bigint, bigint, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.uzum_payment_transition(text, uuid, uuid, bigint, bigint, bigint, text) TO service_role;