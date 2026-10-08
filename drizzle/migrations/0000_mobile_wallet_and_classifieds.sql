CREATE TABLE public.cash_wallets (
  user_id uuid PRIMARY KEY,
  balance numeric(14,2) NOT NULL DEFAULT 0 CHECK (balance >= 0),
  currency text NOT NULL DEFAULT 'UZS' CHECK (currency = 'UZS'),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.cash_wallets TO authenticated;
GRANT ALL ON public.cash_wallets TO service_role;
ALTER TABLE public.cash_wallets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own cash wallet" ON public.cash_wallets FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.cash_wallet_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  kind text NOT NULL CHECK (kind IN ('topup','payment','refund','adjustment')),
  amount numeric(14,2) NOT NULL CHECK (amount > 0),
  balance_before numeric(14,2) NOT NULL CHECK (balance_before >= 0),
  balance_after numeric(14,2) NOT NULL CHECK (balance_after >= 0),
  status text NOT NULL DEFAULT 'completed' CHECK (status IN ('pending','completed','failed','cancelled')),
  provider text,
  payment_id uuid,
  service_type text,
  service_reference text,
  idempotency_key text NOT NULL,
  description text NOT NULL DEFAULT '',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (idempotency_key)
);
GRANT SELECT ON public.cash_wallet_transactions TO authenticated;
GRANT ALL ON public.cash_wallet_transactions TO service_role;
ALTER TABLE public.cash_wallet_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own wallet transactions" ON public.cash_wallet_transactions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE INDEX cash_wallet_transactions_user_created_idx ON public.cash_wallet_transactions(user_id, created_at DESC);
CREATE UNIQUE INDEX cash_wallet_transactions_payment_kind_idx ON public.cash_wallet_transactions(payment_id, kind) WHERE payment_id IS NOT NULL;

CREATE TABLE public.mobile_classifieds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  category text NOT NULL CHECK (category IN ('medical','jobs','equipment','partnership')),
  title text NOT NULL CHECK (char_length(title) BETWEEN 5 AND 120),
  description text NOT NULL CHECK (char_length(description) BETWEEN 20 AND 2000),
  region text NOT NULL CHECK (char_length(region) BETWEEN 2 AND 80),
  contact_phone text CHECK (contact_phone IS NULL OR contact_phone ~ '^\\+998[0-9]{9}$'),
  destination_url text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('draft','pending','approved','rejected','archived')),
  moderation_note text,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.mobile_classifieds TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.mobile_classifieds TO authenticated;
GRANT ALL ON public.mobile_classifieds TO service_role;
ALTER TABLE public.mobile_classifieds ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public reads approved active classifieds" ON public.mobile_classifieds FOR SELECT TO anon, authenticated USING (status = 'approved' AND (expires_at IS NULL OR expires_at > now()));
CREATE POLICY "Owners read own classifieds" ON public.mobile_classifieds FOR SELECT TO authenticated USING (auth.uid() = owner_id);
CREATE POLICY "Owners create pending classifieds" ON public.mobile_classifieds FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id AND status IN ('draft','pending'));
CREATE POLICY "Owners update unapproved classifieds" ON public.mobile_classifieds FOR UPDATE TO authenticated USING (auth.uid() = owner_id AND status IN ('draft','pending','rejected')) WITH CHECK (auth.uid() = owner_id AND status IN ('draft','pending'));
CREATE POLICY "Owners delete unapproved classifieds" ON public.mobile_classifieds FOR DELETE TO authenticated USING (auth.uid() = owner_id AND status IN ('draft','pending','rejected'));
CREATE POLICY "Admins manage classifieds" ON public.mobile_classifieds FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE INDEX mobile_classifieds_public_idx ON public.mobile_classifieds(status, category, created_at DESC);
CREATE INDEX mobile_classifieds_owner_idx ON public.mobile_classifieds(owner_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.cash_wallet_apply_platform_payment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  before_balance numeric(14,2);
  after_balance numeric(14,2);
BEGIN
  IF NEW.purpose <> 'cash_wallet_topup' OR NEW.user_id IS NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.status IN ('paid','completed') AND OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.cash_wallets(user_id) VALUES (NEW.user_id) ON CONFLICT (user_id) DO NOTHING;
    SELECT balance INTO before_balance FROM public.cash_wallets WHERE user_id = NEW.user_id FOR UPDATE;
    after_balance := before_balance + NEW.amount;
    INSERT INTO public.cash_wallet_transactions(user_id, kind, amount, balance_before, balance_after, provider, payment_id, idempotency_key, description)
    VALUES (NEW.user_id, 'topup', NEW.amount, before_balance, after_balance, NEW.provider, NEW.id, 'topup:' || NEW.id::text, 'Avans hamyonini to‘ldirish')
    ON CONFLICT (idempotency_key) DO NOTHING;
    IF FOUND THEN
      UPDATE public.cash_wallets SET balance = after_balance, updated_at = now() WHERE user_id = NEW.user_id;
    END IF;
  ELSIF NEW.status = 'refunded' AND OLD.status IS DISTINCT FROM NEW.status THEN
    SELECT balance INTO before_balance FROM public.cash_wallets WHERE user_id = NEW.user_id FOR UPDATE;
    IF before_balance IS NOT NULL AND before_balance >= NEW.amount THEN
      after_balance := before_balance - NEW.amount;
      INSERT INTO public.cash_wallet_transactions(user_id, kind, amount, balance_before, balance_after, provider, payment_id, idempotency_key, description)
      VALUES (NEW.user_id, 'adjustment', NEW.amount, before_balance, after_balance, NEW.provider, NEW.id, 'topup-refund:' || NEW.id::text, 'Qaytarilgan avans to‘ldirishi')
      ON CONFLICT (idempotency_key) DO NOTHING;
      IF FOUND THEN
        UPDATE public.cash_wallets SET balance = after_balance, updated_at = now() WHERE user_id = NEW.user_id;
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.cash_wallet_apply_platform_payment() FROM PUBLIC;
CREATE TRIGGER cash_wallet_platform_payment_status
AFTER UPDATE OF status ON public.platform_payments
FOR EACH ROW EXECUTE FUNCTION public.cash_wallet_apply_platform_payment();

CREATE OR REPLACE FUNCTION public.cash_wallet_spend(
  _amount numeric,
  _service_type text,
  _service_reference text,
  _idempotency_key text,
  _description text DEFAULT ''
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  before_balance numeric(14,2);
  after_balance numeric(14,2);
  existing public.cash_wallet_transactions%ROWTYPE;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'unauthorized'; END IF;
  IF _amount IS NULL OR _amount <= 0 OR _amount > 100000000 THEN RAISE EXCEPTION 'invalid_amount'; END IF;
  IF _service_type IS NULL OR char_length(_service_type) NOT BETWEEN 2 AND 60 THEN RAISE EXCEPTION 'invalid_service_type'; END IF;
  IF _service_reference IS NULL OR char_length(_service_reference) NOT BETWEEN 3 AND 160 THEN RAISE EXCEPTION 'invalid_service_reference'; END IF;
  IF _idempotency_key IS NULL OR char_length(_idempotency_key) NOT BETWEEN 8 AND 160 THEN RAISE EXCEPTION 'invalid_idempotency_key'; END IF;

  SELECT * INTO existing FROM public.cash_wallet_transactions WHERE idempotency_key = _idempotency_key;
  IF FOUND THEN
    IF existing.user_id <> uid THEN RAISE EXCEPTION 'idempotency_conflict'; END IF;
    RETURN jsonb_build_object('ok', true, 'already', true, 'balance', existing.balance_after, 'transaction_id', existing.id);
  END IF;

  INSERT INTO public.cash_wallets(user_id) VALUES (uid) ON CONFLICT (user_id) DO NOTHING;
  SELECT balance INTO before_balance FROM public.cash_wallets WHERE user_id = uid FOR UPDATE;
  IF before_balance < _amount THEN
    RETURN jsonb_build_object('ok', false, 'error', 'insufficient_balance', 'balance', before_balance);
  END IF;
  after_balance := before_balance - _amount;
  INSERT INTO public.cash_wallet_transactions(user_id, kind, amount, balance_before, balance_after, service_type, service_reference, idempotency_key, description)
  VALUES (uid, 'payment', _amount, before_balance, after_balance, _service_type, _service_reference, _idempotency_key, COALESCE(_description, ''))
  RETURNING id INTO existing.id;
  UPDATE public.cash_wallets SET balance = after_balance, updated_at = now() WHERE user_id = uid;
  RETURN jsonb_build_object('ok', true, 'balance', after_balance, 'transaction_id', existing.id);
END;
$$;
REVOKE ALL ON FUNCTION public.cash_wallet_spend(numeric,text,text,text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cash_wallet_spend(numeric,text,text,text,text) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.cash_wallet_refund(
  _original_transaction_id uuid,
  _idempotency_key text,
  _description text DEFAULT ''
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  original public.cash_wallet_transactions%ROWTYPE;
  before_balance numeric(14,2);
  after_balance numeric(14,2);
  new_id uuid;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'unauthorized'; END IF;
  SELECT * INTO original FROM public.cash_wallet_transactions WHERE id = _original_transaction_id AND user_id = uid AND kind = 'payment';
  IF NOT FOUND THEN RAISE EXCEPTION 'payment_not_found'; END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.appointments a
    WHERE a.id::text = original.service_reference AND a.patient_id = uid AND a.status IN ('cancelled','rejected')
  ) THEN RAISE EXCEPTION 'refund_not_authorized'; END IF;
  SELECT balance INTO before_balance FROM public.cash_wallets WHERE user_id = uid FOR UPDATE;
  after_balance := before_balance + original.amount;
  INSERT INTO public.cash_wallet_transactions(user_id, kind, amount, balance_before, balance_after, service_type, service_reference, idempotency_key, description, metadata)
  VALUES (uid, 'refund', original.amount, before_balance, after_balance, original.service_type, original.service_reference, _idempotency_key, COALESCE(_description, 'Qaytarish'), jsonb_build_object('original_transaction_id', original.id))
  ON CONFLICT (idempotency_key) DO NOTHING RETURNING id INTO new_id;
  IF new_id IS NOT NULL THEN UPDATE public.cash_wallets SET balance = after_balance, updated_at = now() WHERE user_id = uid; END IF;
  RETURN jsonb_build_object('ok', true, 'already', new_id IS NULL, 'balance', CASE WHEN new_id IS NULL THEN before_balance ELSE after_balance END, 'transaction_id', new_id);
END;
$$;
REVOKE ALL ON FUNCTION public.cash_wallet_refund(uuid,text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cash_wallet_refund(uuid,text,text) TO authenticated, service_role;
