
CREATE TABLE IF NOT EXISTS public.org_credit_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  org_type text NOT NULL,
  org_id uuid,
  org_name text,
  contract_id uuid,
  balance integer NOT NULL DEFAULT 0,
  lifetime_coins integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (owner_id, org_type, org_id)
);
GRANT SELECT ON public.org_credit_accounts TO authenticated;
GRANT ALL ON public.org_credit_accounts TO service_role;
ALTER TABLE public.org_credit_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org credit owner read" ON public.org_credit_accounts FOR SELECT TO authenticated
  USING (owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE TABLE IF NOT EXISTS public.org_credit_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES public.org_credit_accounts(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL,
  actor_id uuid,
  payment_id uuid,
  contract_id uuid,
  type text NOT NULL,
  amount integer NOT NULL,
  balance_before integer NOT NULL DEFAULT 0,
  balance_after integer NOT NULL DEFAULT 0,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_org_credit_ledger_account ON public.org_credit_ledger(account_id, created_at DESC);
GRANT SELECT ON public.org_credit_ledger TO authenticated;
GRANT ALL ON public.org_credit_ledger TO service_role;
ALTER TABLE public.org_credit_ledger ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org ledger owner read" ON public.org_credit_ledger FOR SELECT TO authenticated
  USING (owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.touch_org_credit_accounts()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
DROP TRIGGER IF EXISTS trg_org_credit_accounts_touch ON public.org_credit_accounts;
CREATE TRIGGER trg_org_credit_accounts_touch BEFORE UPDATE ON public.org_credit_accounts
FOR EACH ROW EXECUTE FUNCTION public.touch_org_credit_accounts();

-- Muassasa hisobiga coin qo'shish / yechish (service_role orqali)
CREATE OR REPLACE FUNCTION public.org_credit_apply(
  _owner_id uuid, _org_type text, _org_id uuid, _org_name text,
  _amount integer, _type text, _description text,
  _payment_id uuid DEFAULT NULL, _contract_id uuid DEFAULT NULL, _actor_id uuid DEFAULT NULL
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE acc public.org_credit_accounts%ROWTYPE; before_bal integer; after_bal integer;
BEGIN
  SELECT * INTO acc FROM public.org_credit_accounts
   WHERE owner_id = _owner_id AND org_type = _org_type
     AND org_id IS NOT DISTINCT FROM _org_id FOR UPDATE;
  IF NOT FOUND THEN
    INSERT INTO public.org_credit_accounts (owner_id, org_type, org_id, org_name, contract_id)
    VALUES (_owner_id, _org_type, _org_id, _org_name, _contract_id)
    RETURNING * INTO acc;
  END IF;

  before_bal := acc.balance;
  after_bal := GREATEST(0, before_bal + _amount);

  UPDATE public.org_credit_accounts
     SET balance = after_bal,
         lifetime_coins = lifetime_coins + GREATEST(_amount, 0),
         org_name = COALESCE(_org_name, org_name),
         contract_id = COALESCE(_contract_id, contract_id)
   WHERE id = acc.id;

  INSERT INTO public.org_credit_ledger
    (account_id, owner_id, actor_id, payment_id, contract_id, type, amount, balance_before, balance_after, description)
  VALUES (acc.id, _owner_id, _actor_id, _payment_id, COALESCE(_contract_id, acc.contract_id), _type, _amount,
          before_bal, after_bal, _description);

  RETURN jsonb_build_object('ok', true, 'account_id', acc.id, 'balance', after_bal);
END; $$;
REVOKE ALL ON FUNCTION public.org_credit_apply(uuid,text,uuid,text,integer,text,text,uuid,uuid,uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.org_credit_apply(uuid,text,uuid,text,integer,text,text,uuid,uuid,uuid) TO service_role;

-- To'lovni qaytarish: coin yechiladi, obuna bekor qilinadi
CREATE OR REPLACE FUNCTION public.refund_platform_payment(_payment_id uuid, _reason text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  p RECORD;
  coins integer := 0;
  org_id_txt text;
  remaining integer;
  r RECORD;
  take integer;
  bal_after integer := 0;
BEGIN
  SELECT * INTO p FROM public.platform_payments WHERE id = _payment_id FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok', false, 'error', 'payment_not_found'); END IF;
  IF p.status = 'refunded' THEN RETURN jsonb_build_object('ok', true, 'already', true); END IF;

  coins := COALESCE((p.metadata->>'coins_granted')::integer, 0);
  org_id_txt := p.metadata->>'org_id';

  IF coins > 0 AND org_id_txt IS NOT NULL THEN
    PERFORM public.org_credit_apply(
      p.user_id, COALESCE(p.metadata->>'org_type','clinic'), org_id_txt::uuid,
      p.metadata->>'org_name', -coins, 'REFUND',
      COALESCE(_reason, 'To''lov qaytarildi'), p.id, NULL, NULL);
  ELSIF coins > 0 THEN
    remaining := coins;
    FOR r IN SELECT id, balance FROM public.user_credits
              WHERE user_id = p.user_id AND balance > 0
              ORDER BY expires_at DESC LOOP
      EXIT WHEN remaining <= 0;
      take := LEAST(remaining, r.balance);
      UPDATE public.user_credits SET balance = balance - take WHERE id = r.id;
      remaining := remaining - take;
    END LOOP;

    SELECT COALESCE(SUM(balance),0) INTO bal_after FROM public.user_credits
     WHERE user_id = p.user_id AND expires_at > now() AND balance > 0;

    INSERT INTO public.credit_history (user_id, amount, type, description, balance_after)
    VALUES (p.user_id, -coins, 'refund', COALESCE(_reason, 'To''lov qaytarildi'), bal_after);

    INSERT INTO public.med_coin_ledger
      (user_id, payment_id, transaction_id, order_id, type, amount, balance_before, balance_after, source, description)
    VALUES (p.user_id, p.id, p.provider_transaction_id, p.id::text, 'REFUND', -coins,
            bal_after + coins, bal_after, p.provider, COALESCE(_reason, 'To''lov qaytarildi'));
  END IF;

  UPDATE public.ai_subscriptions SET status = 'cancelled', updated_at = now()
   WHERE user_id = p.user_id AND status = 'active'
     AND started_at >= COALESCE(p.paid_at, p.created_at) - interval '1 day';

  UPDATE public.payment_invoices SET status = 'refunded' WHERE payment_id = p.id;

  UPDATE public.platform_payments
     SET status = 'refunded',
         metadata = COALESCE(metadata,'{}'::jsonb) || jsonb_build_object(
           'refunded_at', now(), 'refund_reason', _reason, 'coins_reversed', coins)
   WHERE id = p.id;

  RETURN jsonb_build_object('ok', true, 'coins_reversed', coins, 'debt', GREATEST(COALESCE(remaining,0),0));
END; $$;
REVOKE ALL ON FUNCTION public.refund_platform_payment(uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.refund_platform_payment(uuid, text) TO service_role;
