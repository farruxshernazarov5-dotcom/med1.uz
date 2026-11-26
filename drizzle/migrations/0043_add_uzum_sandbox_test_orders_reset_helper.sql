CREATE OR REPLACE FUNCTION public.reset_uzum_sandbox_test_orders(
  _order_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_uid uuid := auth.uid();
  v_owner_id uuid;
  v_item record;
  v_existing public.platform_payments%ROWTYPE;
  v_orders jsonb := '[]'::jsonb;
  v_allowed_ids uuid[] := ARRAY[
    '10000000-0000-4000-8000-000000000001'::uuid,
    '10000000-0000-4000-8000-000000000002'::uuid,
    '10000000-0000-4000-8000-000000000003'::uuid,
    '10000000-0000-4000-8000-000000000004'::uuid
  ];
BEGIN
  IF auth.role() <> 'service_role' AND NOT public.has_role(v_caller_uid, 'admin') THEN
    RAISE EXCEPTION 'Forbidden' USING ERRCODE = '42501';
  END IF;

  IF _order_id IS NOT NULL AND NOT (_order_id = ANY(v_allowed_ids)) THEN
    RAISE EXCEPTION 'Order ID is not a registered Uzum sandbox test order' USING ERRCODE = '22023';
  END IF;

  v_owner_id := COALESCE(
    v_caller_uid,
    (SELECT user_id FROM public.user_roles WHERE role = 'admin' ORDER BY (user_id = 'd81931d1-cfd7-4d39-9376-08fc60a0ecc8'::uuid) DESC LIMIT 1)
  );

  IF v_owner_id IS NULL THEN
    RAISE EXCEPTION 'No admin user found to own Uzum sandbox test orders';
  END IF;

  FOR v_item IN
    SELECT *
    FROM (VALUES
      ('10000000-0000-4000-8000-000000000001'::uuid, 10000::numeric),
      ('10000000-0000-4000-8000-000000000002'::uuid, 50000::numeric),
      ('10000000-0000-4000-8000-000000000003'::uuid, 100000::numeric),
      ('10000000-0000-4000-8000-000000000004'::uuid, 25000::numeric)
    ) AS t(id, amount)
    WHERE _order_id IS NULL OR t.id = _order_id
  LOOP
    SELECT * INTO v_existing
    FROM public.platform_payments
    WHERE id = v_item.id
    FOR UPDATE;

    IF FOUND AND v_existing.fulfilled_at IS NOT NULL AND v_existing.status <> 'refunded' THEN
      PERFORM public.refund_platform_payment(v_existing.id, 'Uzum sandbox test reset');
    END IF;

    DELETE FROM public.uzum_transactions WHERE payment_id = v_item.id;
    DELETE FROM public.payment_invoices WHERE payment_id = v_item.id;

    INSERT INTO public.platform_payments (
      id, user_id, provider, amount, currency, status, purpose, is_test,
      metadata, paid_at, fulfilled_at, provider_transaction_id, provider_payment_id
    )
    VALUES (
      v_item.id,
      COALESCE(v_existing.user_id, v_owner_id),
      'uzum',
      v_item.amount,
      'UZS',
      'pending',
      'uzum_sandbox_test',
      true,
      '{"environment":"sandbox","uzum_service_id":10324}'::jsonb,
      NULL,
      NULL,
      NULL,
      NULL
    )
    ON CONFLICT (id) DO UPDATE SET
      provider = 'uzum',
      amount = EXCLUDED.amount,
      currency = 'UZS',
      status = 'pending',
      purpose = 'uzum_sandbox_test',
      is_test = true,
      metadata = EXCLUDED.metadata,
      paid_at = NULL,
      fulfilled_at = NULL,
      provider_transaction_id = NULL,
      provider_payment_id = NULL,
      updated_at = now();

    v_orders := v_orders || jsonb_build_object(
      'id', v_item.id,
      'amount', v_item.amount,
      'amount_tiyin', (v_item.amount * 100)::bigint,
      'status', 'pending'
    );
  END LOOP;

  RETURN jsonb_build_object('ok', true, 'orders', v_orders);
END;
$$;

REVOKE ALL ON FUNCTION public.reset_uzum_sandbox_test_orders(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.reset_uzum_sandbox_test_orders(uuid) TO authenticated, service_role;