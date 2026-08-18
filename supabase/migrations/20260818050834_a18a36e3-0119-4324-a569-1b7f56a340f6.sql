
-- ============ payment_packages ============
CREATE TABLE public.payment_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name_uz text NOT NULL,
  name_ru text NOT NULL,
  name_en text NOT NULL,
  kind text NOT NULL CHECK (kind IN ('med_coin','subscription')),
  price numeric NOT NULL CHECK (price > 0),
  currency text NOT NULL DEFAULT 'UZS',
  coin_amount integer NOT NULL DEFAULT 0,
  bonus_coins integer NOT NULL DEFAULT 0,
  subscription_tier text,
  duration_days integer NOT NULL DEFAULT 30,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.payment_packages TO anon, authenticated;
GRANT ALL ON public.payment_packages TO service_role;
ALTER TABLE public.payment_packages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active packages" ON public.payment_packages
  FOR SELECT USING (is_active OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins manage packages" ON public.payment_packages
  FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_payment_packages_updated BEFORE UPDATE ON public.payment_packages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============ platform_payments kengaytirish ============
ALTER TABLE public.platform_payments
  ADD COLUMN IF NOT EXISTS package_id uuid REFERENCES public.payment_packages(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS is_test boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS fulfilled_at timestamptz;

ALTER TABLE public.platform_payments DROP CONSTRAINT IF EXISTS platform_payments_status_check;
ALTER TABLE public.platform_payments ADD CONSTRAINT platform_payments_status_check
  CHECK (status IN ('created','pending','prepared','paid','completed','failed','cancelled','refunded'));

CREATE UNIQUE INDEX IF NOT EXISTS uq_platform_payments_provider_tx
  ON public.platform_payments (provider, provider_transaction_id)
  WHERE provider_transaction_id IS NOT NULL;

-- ============ med_coin_ledger ============
CREATE TABLE public.med_coin_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  payment_id uuid REFERENCES public.platform_payments(id) ON DELETE SET NULL,
  transaction_id text,
  order_id text,
  type text NOT NULL CHECK (type IN ('PURCHASE','USAGE','REFUND','BONUS','ADMIN_ADJUSTMENT')),
  amount integer NOT NULL,
  balance_before integer NOT NULL DEFAULT 0,
  balance_after integer NOT NULL DEFAULT 0,
  source text NOT NULL DEFAULT 'system',
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_med_coin_ledger_user ON public.med_coin_ledger (user_id, created_at DESC);
GRANT SELECT ON public.med_coin_ledger TO authenticated;
GRANT ALL ON public.med_coin_ledger TO service_role;
ALTER TABLE public.med_coin_ledger ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own ledger" ON public.med_coin_ledger
  FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));

-- ============ payment_invoices ============
CREATE TABLE public.payment_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number text NOT NULL UNIQUE,
  payment_id uuid NOT NULL UNIQUE REFERENCES public.platform_payments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  provider text NOT NULL DEFAULT 'click',
  provider_transaction_id text,
  package_code text,
  product_name text NOT NULL,
  amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'UZS',
  coin_amount integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'paid' CHECK (status IN ('paid','refunded','cancelled')),
  issued_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_payment_invoices_user ON public.payment_invoices (user_id, issued_at DESC);
GRANT SELECT ON public.payment_invoices TO authenticated;
GRANT ALL ON public.payment_invoices TO service_role;
ALTER TABLE public.payment_invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own invoices" ON public.payment_invoices
  FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_payment_invoices_updated BEFORE UPDATE ON public.payment_invoices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============ payment_refunds ============
CREATE TABLE public.payment_refunds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id uuid NOT NULL REFERENCES public.platform_payments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  amount numeric NOT NULL CHECK (amount > 0),
  coin_adjustment integer NOT NULL DEFAULT 0,
  reason text NOT NULL,
  admin_id uuid,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','completed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_payment_refunds_payment ON public.payment_refunds (payment_id);
GRANT SELECT, INSERT, UPDATE ON public.payment_refunds TO authenticated;
GRANT ALL ON public.payment_refunds TO service_role;
ALTER TABLE public.payment_refunds ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage refunds" ON public.payment_refunds
  FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Users view own refunds" ON public.payment_refunds
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE TRIGGER trg_payment_refunds_updated BEFORE UPDATE ON public.payment_refunds
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============ Invoice raqam generatori ============
CREATE SEQUENCE IF NOT EXISTS public.payment_invoice_seq START 1;
GRANT USAGE ON SEQUENCE public.payment_invoice_seq TO service_role;

-- ============ Atomik fulfillment ============
CREATE OR REPLACE FUNCTION public.click_fulfill_payment(_payment_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  p RECORD;
  pkg RECORD;
  total_coins integer := 0;
  bal_before integer := 0;
  bal_after integer := 0;
  inv_number text;
  sub_id uuid;
  prod_name text;
BEGIN
  SELECT * INTO p FROM public.platform_payments WHERE id = _payment_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'payment_not_found');
  END IF;

  IF p.fulfilled_at IS NOT NULL THEN
    RETURN jsonb_build_object('ok', true, 'already', true);
  END IF;

  SELECT * INTO pkg FROM public.payment_packages WHERE id = p.package_id;

  SELECT COALESCE(SUM(balance),0) INTO bal_before
  FROM public.user_credits
  WHERE user_id = p.user_id AND expires_at > now() AND balance > 0;

  IF pkg.id IS NOT NULL AND pkg.kind = 'med_coin' THEN
    total_coins := pkg.coin_amount + pkg.bonus_coins;
    prod_name := pkg.name_uz;

    INSERT INTO public.user_credits (user_id, balance, purchased_at, expires_at, package_name)
    VALUES (p.user_id, total_coins, now(), now() + (pkg.duration_days || ' days')::interval, pkg.code);

    bal_after := bal_before + total_coins;

    INSERT INTO public.credit_history (user_id, amount, type, description, balance_after)
    VALUES (p.user_id, total_coins, 'purchase', pkg.name_uz || ' (Click)', bal_after);

  ELSIF pkg.id IS NOT NULL AND pkg.kind = 'subscription' THEN
    prod_name := pkg.name_uz;
    total_coins := pkg.coin_amount + pkg.bonus_coins;

    UPDATE public.ai_subscriptions
      SET status = 'expired', updated_at = now()
      WHERE user_id = p.user_id AND status = 'active';

    INSERT INTO public.ai_subscriptions (user_id, plan_id, tier, billing_period, services, status, started_at, expires_at)
    VALUES (p.user_id, pkg.code, COALESCE(pkg.subscription_tier,'lite'), 'monthly', '{}',
            'active', now(), now() + (pkg.duration_days || ' days')::interval)
    RETURNING id INTO sub_id;

    IF total_coins > 0 THEN
      INSERT INTO public.user_credits (user_id, balance, purchased_at, expires_at, package_name)
      VALUES (p.user_id, total_coins, now(), now() + (pkg.duration_days || ' days')::interval, pkg.code);
      bal_after := bal_before + total_coins;
      INSERT INTO public.credit_history (user_id, amount, type, description, balance_after)
      VALUES (p.user_id, total_coins, 'purchase', pkg.name_uz || ' (Click obuna)', bal_after);
    ELSE
      bal_after := bal_before;
    END IF;
  ELSE
    prod_name := COALESCE(p.purpose, 'To''lov');
    bal_after := bal_before;
  END IF;

  IF total_coins > 0 THEN
    INSERT INTO public.med_coin_ledger
      (user_id, payment_id, transaction_id, order_id, type, amount, balance_before, balance_after, source, description)
    VALUES (p.user_id, p.id, p.provider_transaction_id, p.id::text, 'PURCHASE', total_coins,
            bal_before, bal_after, p.provider, prod_name);
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
    SET status = 'completed', fulfilled_at = now(), paid_at = COALESCE(paid_at, now())
    WHERE id = p.id;

  INSERT INTO public.audit_logs (action, entity_type, entity_id, user_id, details)
  VALUES ('payment_completed', 'platform_payments', p.id, p.user_id,
          jsonb_build_object('provider', p.provider, 'amount', p.amount,
                             'coins', total_coins, 'invoice', inv_number));

  RETURN jsonb_build_object('ok', true, 'invoice_number', inv_number,
                            'coins', total_coins, 'balance_after', bal_after,
                            'subscription_id', sub_id, 'product', prod_name);
END;
$$;

REVOKE ALL ON FUNCTION public.click_fulfill_payment(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.click_fulfill_payment(uuid) TO service_role;

-- ============ Refund adjustment ============
CREATE OR REPLACE FUNCTION public.click_refund_payment(_payment_id uuid, _reason text, _admin uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  p RECORD;
  inv RECORD;
  bal_before integer := 0;
  bal_after integer := 0;
  coins integer := 0;
BEGIN
  IF NOT public.has_role(_admin, 'admin') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'forbidden');
  END IF;

  SELECT * INTO p FROM public.platform_payments WHERE id = _payment_id FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok', false, 'error', 'payment_not_found'); END IF;
  IF p.status = 'refunded' THEN RETURN jsonb_build_object('ok', true, 'already', true); END IF;

  SELECT * INTO inv FROM public.payment_invoices WHERE payment_id = p.id;
  coins := COALESCE(inv.coin_amount, 0);

  SELECT COALESCE(SUM(balance),0) INTO bal_before
  FROM public.user_credits WHERE user_id = p.user_id AND expires_at > now() AND balance > 0;

  IF coins > 0 THEN
    UPDATE public.user_credits
      SET balance = GREATEST(0, balance - coins)
      WHERE id = (SELECT id FROM public.user_credits
                  WHERE user_id = p.user_id AND package_name = inv.package_code
                  ORDER BY created_at DESC LIMIT 1);
    bal_after := GREATEST(0, bal_before - coins);
    INSERT INTO public.credit_history (user_id, amount, type, description, balance_after)
    VALUES (p.user_id, -coins, 'refund', 'Refund: ' || _reason, bal_after);
    INSERT INTO public.med_coin_ledger
      (user_id, payment_id, transaction_id, order_id, type, amount, balance_before, balance_after, source, description)
    VALUES (p.user_id, p.id, p.provider_transaction_id, p.id::text, 'REFUND', -coins,
            bal_before, bal_after, p.provider, _reason);
  ELSE
    bal_after := bal_before;
  END IF;

  UPDATE public.ai_subscriptions SET status = 'expired', updated_at = now()
    WHERE user_id = p.user_id AND status = 'active'
      AND plan_id = COALESCE(inv.package_code, '__none__');

  UPDATE public.payment_invoices SET status = 'refunded' WHERE payment_id = p.id;
  UPDATE public.platform_payments SET status = 'refunded' WHERE id = p.id;

  INSERT INTO public.payment_refunds (payment_id, user_id, amount, coin_adjustment, reason, admin_id, status)
  VALUES (p.id, p.user_id, p.amount, -coins, _reason, _admin, 'completed');

  INSERT INTO public.audit_logs (action, entity_type, entity_id, user_id, details)
  VALUES ('payment_refunded', 'platform_payments', p.id, _admin,
          jsonb_build_object('reason', _reason, 'coins', -coins, 'amount', p.amount));

  RETURN jsonb_build_object('ok', true, 'coins_removed', coins, 'balance_after', bal_after);
END;
$$;

REVOKE ALL ON FUNCTION public.click_refund_payment(uuid, text, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.click_refund_payment(uuid, text, uuid) TO authenticated, service_role;
