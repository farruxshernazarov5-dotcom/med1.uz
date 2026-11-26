CREATE TABLE public.uzum_transactions (
  trans_id uuid PRIMARY KEY,
  payment_id uuid NOT NULL UNIQUE REFERENCES public.platform_payments(id) ON DELETE RESTRICT,
  service_id bigint NOT NULL,
  amount_tiyin bigint NOT NULL CHECK (amount_tiyin > 0),
  status text NOT NULL DEFAULT 'CREATED' CHECK (status IN ('CREATED', 'CONFIRMED', 'REVERSED')),
  trans_time bigint NOT NULL,
  confirm_time bigint,
  reverse_time bigint,
  payment_source text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

REVOKE ALL ON public.uzum_transactions FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.uzum_transactions TO service_role;
ALTER TABLE public.uzum_transactions ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_uzum_transactions_status ON public.uzum_transactions(status);
CREATE INDEX idx_uzum_transactions_payment ON public.uzum_transactions(payment_id);

CREATE OR REPLACE FUNCTION public.uzum_payment_transition(
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
  t public.uzum_transactions%ROWTYPE;
  p public.platform_payments%ROWTYPE;
  result jsonb;
  was_confirmed boolean := false;
BEGIN
  IF _action NOT IN ('create', 'confirm', 'reverse') THEN
    RETURN jsonb_build_object('ok', false, 'error_code', '10003');
  END IF;

  IF _action = 'create' THEN
    SELECT * INTO t FROM public.uzum_transactions WHERE trans_id = _trans_id FOR UPDATE;
    IF FOUND THEN
      RETURN jsonb_build_object('ok', false, 'error_code', '10010');
    END IF;

    SELECT * INTO p FROM public.platform_payments WHERE id = _payment_id FOR UPDATE;
    IF NOT FOUND OR p.provider <> 'uzum' THEN
      RETURN jsonb_build_object('ok', false, 'error_code', '10007');
    END IF;
    IF p.status IN ('paid', 'completed') THEN
      RETURN jsonb_build_object('ok', false, 'error_code', '10008');
    END IF;
    IF p.status IN ('cancelled', 'refunded', 'failed') OR p.status <> 'pending' THEN
      RETURN jsonb_build_object('ok', false, 'error_code', '10009');
    END IF;
    IF _amount_tiyin IS NULL OR _amount_tiyin <= 0 OR round(p.amount * 100) <> _amount_tiyin THEN
      RETURN jsonb_build_object('ok', false, 'error_code', '10011');
    END IF;

    SELECT * INTO t FROM public.uzum_transactions WHERE payment_id = p.id FOR UPDATE;
    IF FOUND THEN
      RETURN jsonb_build_object('ok', false, 'error_code', '10010');
    END IF;

    INSERT INTO public.uzum_transactions
      (trans_id, payment_id, service_id, amount_tiyin, status, trans_time)
    VALUES
      (_trans_id, p.id, _service_id, _amount_tiyin, 'CREATED', _event_time);

    UPDATE public.platform_payments
    SET provider_transaction_id = _trans_id::text,
        metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
          'uzum_trans_id', _trans_id::text,
          'uzum_service_id', _service_id,
          'uzum_trans_time', _event_time
        )
    WHERE id = p.id;

    RETURN jsonb_build_object(
      'ok', true, 'payment_id', p.id, 'trans_id', _trans_id,
      'service_id', _service_id, 'status', 'CREATED',
      'trans_time', _event_time, 'amount_tiyin', _amount_tiyin,
      'user_id', p.user_id, 'purpose', p.purpose
    );
  END IF;

  SELECT * INTO t FROM public.uzum_transactions WHERE trans_id = _trans_id FOR UPDATE;
  IF NOT FOUND OR t.service_id <> _service_id THEN
    RETURN jsonb_build_object('ok', false, 'error_code', '10014');
  END IF;

  IF _action = 'confirm' THEN
    IF t.status = 'REVERSED' THEN
      RETURN jsonb_build_object('ok', false, 'error_code', '10015');
    END IF;
    IF t.status = 'CONFIRMED' THEN
      RETURN jsonb_build_object('ok', false, 'error_code', '10016');
    END IF;

    SELECT * INTO p FROM public.platform_payments WHERE id = t.payment_id FOR UPDATE;
    IF NOT FOUND OR p.provider <> 'uzum' THEN
      RETURN jsonb_build_object('ok', false, 'error_code', '10014');
    END IF;

    UPDATE public.platform_payments
    SET status = 'paid',
        paid_at = COALESCE(paid_at, now()),
        provider_transaction_id = _trans_id::text,
        provider_payment_id = _trans_id::text,
        metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
          'uzum_confirmed_at', _event_time,
          'uzum_payment_source', _payment_source
        )
    WHERE id = p.id;

    result := public.fulfill_platform_payment(p.id);
    IF COALESCE((result->>'ok')::boolean, false) IS NOT TRUE THEN
      RAISE EXCEPTION 'Uzum payment fulfillment failed: %', COALESCE(result->>'error', 'unknown');
    END IF;

    UPDATE public.uzum_transactions
    SET status = 'CONFIRMED', confirm_time = _event_time,
        payment_source = _payment_source, updated_at = now()
    WHERE trans_id = _trans_id;

    INSERT INTO public.audit_logs (action, entity_type, entity_id, user_id, details)
    VALUES (
      'payment_completed', 'platform_payments', p.id, p.user_id,
      jsonb_build_object('provider', 'uzum', 'transaction_id', _trans_id::text)
    );

    RETURN jsonb_build_object(
      'ok', true, 'payment_id', p.id, 'trans_id', _trans_id,
      'service_id', t.service_id, 'status', 'CONFIRMED',
      'trans_time', t.trans_time, 'confirm_time', _event_time,
      'reverse_time', null, 'amount_tiyin', t.amount_tiyin,
      'user_id', p.user_id, 'purpose', p.purpose, 'amount', p.amount
    );
  END IF;

  IF t.status = 'REVERSED' THEN
    RETURN jsonb_build_object('ok', false, 'error_code', '10018');
  END IF;

  SELECT * INTO p FROM public.platform_payments WHERE id = t.payment_id FOR UPDATE;
  IF NOT FOUND OR p.provider <> 'uzum' THEN
    RETURN jsonb_build_object('ok', false, 'error_code', '10014');
  END IF;

  was_confirmed := t.status = 'CONFIRMED' OR p.fulfilled_at IS NOT NULL OR p.status IN ('paid', 'completed');
  IF was_confirmed THEN
    result := public.refund_platform_payment(p.id, 'Uzum Bank reverse: ' || _trans_id::text);
    IF COALESCE((result->>'ok')::boolean, false) IS NOT TRUE THEN
      RAISE EXCEPTION 'Uzum payment reversal failed: %', COALESCE(result->>'error', 'unknown');
    END IF;
  ELSE
    UPDATE public.platform_payments
    SET status = 'cancelled',
        metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
          'uzum_reversed_at', _event_time,
          'uzum_reverse_reason', 'created_transaction_reversed'
        )
    WHERE id = p.id;
  END IF;

  UPDATE public.uzum_transactions
  SET status = 'REVERSED', reverse_time = _event_time, updated_at = now()
  WHERE trans_id = _trans_id;

  INSERT INTO public.audit_logs (action, entity_type, entity_id, user_id, details)
  VALUES (
    CASE WHEN was_confirmed THEN 'payment_refunded' ELSE 'payment_cancelled' END,
    'platform_payments', p.id, p.user_id,
    jsonb_build_object('provider', 'uzum', 'transaction_id', _trans_id::text)
  );

  RETURN jsonb_build_object(
    'ok', true, 'payment_id', p.id, 'trans_id', _trans_id,
    'service_id', t.service_id, 'status', 'REVERSED',
    'trans_time', t.trans_time, 'confirm_time', t.confirm_time,
    'reverse_time', _event_time, 'amount_tiyin', t.amount_tiyin,
    'user_id', p.user_id, 'purpose', p.purpose, 'amount', p.amount
  );
EXCEPTION
  WHEN unique_violation THEN
    RETURN jsonb_build_object('ok', false, 'error_code', '10010');
END;
$$;

REVOKE ALL ON FUNCTION public.uzum_payment_transition(text, uuid, uuid, bigint, bigint, bigint, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.uzum_payment_transition(text, uuid, uuid, bigint, bigint, bigint, text) TO service_role;