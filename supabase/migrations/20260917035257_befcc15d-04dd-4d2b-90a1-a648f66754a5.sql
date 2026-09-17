
CREATE OR REPLACE FUNCTION public.fulfill_platform_payment(_payment_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  p RECORD;
  pkg public.payment_packages%ROWTYPE;
  total_coins integer := 0;
  bal_before integer := 0;
  bal_after integer := 0;
  inv_number text;
  sub_id uuid;
  prod_name text;
  purpose_kind text;
  code_hint text;
  org_id_txt text;
  org_res jsonb;
BEGIN
  SELECT * INTO p FROM public.platform_payments WHERE id = _payment_id FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok', false, 'error', 'payment_not_found'); END IF;
  IF p.fulfilled_at IS NOT NULL THEN RETURN jsonb_build_object('ok', true, 'already', true); END IF;
  IF p.status NOT IN ('paid', 'completed') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'payment_not_paid', 'status', p.status);
  END IF;

  IF p.package_id IS NOT NULL THEN
    SELECT * INTO pkg FROM public.payment_packages WHERE id = p.package_id;
  END IF;

  IF pkg.id IS NULL THEN
    code_hint := NULLIF(split_part(COALESCE(p.purpose, ''), ':', 2), '');
    IF code_hint IS NOT NULL THEN
      SELECT * INTO pkg FROM public.payment_packages
       WHERE is_active AND (code = code_hint OR code = 'sub_' || code_hint OR code = 'coin_' || code_hint)
       LIMIT 1;
    END IF;
  END IF;

  IF pkg.id IS NULL THEN
    purpose_kind := CASE
      WHEN COALESCE(p.purpose,'') LIKE 'ai_subscription%' OR COALESCE(p.purpose,'') LIKE 'sub%' THEN 'subscription'
      ELSE 'med_coin' END;
    SELECT * INTO pkg FROM public.payment_packages
     WHERE is_active AND price = p.amount
     ORDER BY (kind = purpose_kind) DESC
     LIMIT 1;
  END IF;

  org_id_txt := p.metadata->>'org_id';

  SELECT COALESCE(SUM(balance),0) INTO bal_before
  FROM public.user_credits
  WHERE user_id = p.user_id AND expires_at > now() AND balance > 0;
  bal_after := bal_before;

  IF pkg.id IS NOT NULL THEN
    prod_name := pkg.name_uz;
    total_coins := COALESCE(pkg.coin_amount,0) + COALESCE(pkg.bonus_coins,0);

    IF pkg.kind = 'subscription' THEN
      UPDATE public.ai_subscriptions SET status = 'expired', updated_at = now()
       WHERE user_id = p.user_id AND status = 'active';
      INSERT INTO public.ai_subscriptions (user_id, plan_id, tier, billing_period, services, status, started_at, expires_at)
      VALUES (p.user_id, pkg.code, COALESCE(pkg.subscription_tier,'lite'), 'monthly', '{}',
              'active', now(), now() + (pkg.duration_days || ' days')::interval)
      RETURNING id INTO sub_id;
    END IF;

    IF total_coins > 0 THEN
      IF org_id_txt IS NOT NULL THEN
        -- Muassasa hisobiga (shartnoma bo'yicha)
        org_res := public.org_credit_apply(
          p.user_id,
          COALESCE(p.metadata->>'org_type','clinic'),
          org_id_txt::uuid,
          p.metadata->>'org_name',
          total_coins, 'PURCHASE',
          prod_name || ' (' || p.provider || ')',
          p.id,
          NULLIF(p.metadata->>'contract_id','')::uuid,
          NULL);
      ELSE
        INSERT INTO public.user_credits (user_id, balance, purchased_at, expires_at, package_name)
        VALUES (p.user_id, total_coins, now(), now() + (pkg.duration_days || ' days')::interval, pkg.code);
        bal_after := bal_before + total_coins;
        INSERT INTO public.credit_history (user_id, amount, type, description, balance_after)
        VALUES (p.user_id, total_coins, 'purchase', prod_name || ' (' || p.provider || ')', bal_after);
        INSERT INTO public.med_coin_ledger
          (user_id, payment_id, transaction_id, order_id, type, amount, balance_before, balance_after, source, description)
        VALUES (p.user_id, p.id, p.provider_transaction_id, p.id::text, 'PURCHASE', total_coins,
                bal_before, bal_after, p.provider, prod_name);
      END IF;
    END IF;
  ELSE
    prod_name := COALESCE(p.purpose, 'To''lov');
  END IF;

  inv_number := 'INV-' || to_char(now(), 'YYYY') || '-' ||
                lpad(nextval('public.payment_invoice_seq')::text, 5, '0');

  INSERT INTO public.payment_invoices
    (invoice_number, payment_id, user_id, provider, provider_transaction_id, package_code,
     product_name, amount, currency, coin_amount, status)
  VALUES (inv_number, p.id, p.user_id, p.provider, p.provider_transaction_id, pkg.code,
          prod_name, p.amount, p.currency, total_coins, 'paid')
  ON CONFLICT (payment_id) DO NOTHING;

  UPDATE public.platform_payments
     SET status = 'completed',
         fulfilled_at = now(),
         paid_at = COALESCE(paid_at, now()),
         metadata = COALESCE(metadata,'{}'::jsonb) || jsonb_build_object(
           'fulfilled', true, 'coins_granted', total_coins,
           'invoice_number', inv_number, 'product', prod_name,
           'package_code', pkg.code, 'package_kind', pkg.kind,
           'credited_to', CASE WHEN org_id_txt IS NOT NULL THEN 'org' ELSE 'user' END)
   WHERE id = p.id;

  INSERT INTO public.audit_logs (action, entity_type, entity_id, user_id, details)
  VALUES ('payment_fulfilled', 'platform_payments', p.id, p.user_id,
          jsonb_build_object('provider', p.provider, 'amount', p.amount,
                             'coins', total_coins, 'invoice', inv_number,
                             'package', pkg.code, 'org_id', org_id_txt));

  RETURN jsonb_build_object('ok', true, 'invoice_number', inv_number,
                            'coins', total_coins, 'balance_after', bal_after,
                            'subscription_id', sub_id, 'product', prod_name,
                            'org', org_res);
END; $$;
REVOKE ALL ON FUNCTION public.fulfill_platform_payment(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fulfill_platform_payment(uuid) TO service_role;
