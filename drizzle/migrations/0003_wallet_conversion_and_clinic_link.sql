ALTER TABLE public.referral_settings ADD COLUMN IF NOT EXISTS credit_to_uzs numeric NOT NULL DEFAULT 1000 CHECK (credit_to_uzs > 0 AND credit_to_uzs <= 1000000);

CREATE OR REPLACE FUNCTION public.get_credit_to_uzs_rate()
RETURNS numeric LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE((SELECT credit_to_uzs FROM public.referral_settings ORDER BY id LIMIT 1), 1000)
$$;
GRANT EXECUTE ON FUNCTION public.get_credit_to_uzs_rate() TO authenticated;

CREATE OR REPLACE FUNCTION public.convert_referral_credits_to_cash(_credits numeric, _idempotency_key text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  uid uuid := auth.uid();
  rate numeric := public.get_credit_to_uzs_rate();
  credits_before numeric;
  cash_before numeric(14,2);
  cash_after numeric(14,2);
  uzs numeric(14,2);
  existing public.cash_wallet_transactions%ROWTYPE;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'unauthorized'; END IF;
  IF _credits IS NULL OR _credits < 1 OR _credits <> trunc(_credits) OR _credits > 1000000 THEN RAISE EXCEPTION 'invalid_amount'; END IF;
  IF _idempotency_key IS NULL OR char_length(_idempotency_key) NOT BETWEEN 8 AND 160 THEN RAISE EXCEPTION 'invalid_idempotency_key'; END IF;

  SELECT * INTO existing FROM public.cash_wallet_transactions WHERE idempotency_key = _idempotency_key;
  IF FOUND THEN
    IF existing.user_id <> uid THEN RAISE EXCEPTION 'idempotency_conflict'; END IF;
    RETURN jsonb_build_object('ok', true, 'already', true, 'balance', existing.balance_after);
  END IF;

  SELECT credits_balance INTO credits_before FROM public.referral_wallet WHERE owner_id = uid FOR UPDATE;
  IF credits_before IS NULL OR credits_before < _credits THEN
    RETURN jsonb_build_object('ok', false, 'error', 'insufficient_credits', 'credits', COALESCE(credits_before, 0));
  END IF;

  uzs := round(_credits * rate, 2);
  UPDATE public.referral_wallet SET credits_balance = credits_balance - _credits, lifetime_spent = lifetime_spent + _credits, updated_at = now() WHERE owner_id = uid;
  INSERT INTO public.referral_rewards_ledger(user_id, kind, amount, applied_to, balance_before, balance_after, notes)
  VALUES (uid, 'credits', _credits, 'wallet', credits_before, credits_before - _credits, 'So‘mga aylantirildi: ' || uzs || ' so‘m');

  INSERT INTO public.cash_wallets(user_id) VALUES (uid) ON CONFLICT (user_id) DO NOTHING;
  SELECT balance INTO cash_before FROM public.cash_wallets WHERE user_id = uid FOR UPDATE;
  cash_after := cash_before + uzs;
  INSERT INTO public.cash_wallet_transactions(user_id, kind, amount, balance_before, balance_after, status, provider, service_type, service_reference, idempotency_key, description, metadata)
  VALUES (uid, 'topup', uzs, cash_before, cash_after, 'completed', 'referral', 'referral_conversion', 'credits-' || _credits, _idempotency_key, 'Referral bonus so‘mga aylantirildi', jsonb_build_object('credits', _credits, 'rate', rate));
  UPDATE public.cash_wallets SET balance = cash_after, updated_at = now() WHERE user_id = uid;
  RETURN jsonb_build_object('ok', true, 'balance', cash_after, 'added', uzs, 'credits_left', credits_before - _credits);
END;
$$;
REVOKE ALL ON FUNCTION public.convert_referral_credits_to_cash(numeric, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.convert_referral_credits_to_cash(numeric, text) TO authenticated;

CREATE TABLE public.external_clinic_link_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  clinic_name text NOT NULL CHECK (char_length(clinic_name) BETWEEN 2 AND 160),
  clinic_region text CHECK (clinic_region IS NULL OR char_length(clinic_region) <= 80),
  clinic_phone text CHECK (clinic_phone IS NULL OR clinic_phone ~ '^\+998[0-9]{9}$'),
  software_name text NOT NULL CHECK (char_length(software_name) BETWEEN 2 AND 120),
  patient_card_number text CHECK (patient_card_number IS NULL OR char_length(patient_card_number) <= 60),
  data_scopes text[] NOT NULL DEFAULT ARRAY['visits','labs']::text[] CHECK (data_scopes <@ ARRAY['visits','labs','prescriptions','imaging','documents']::text[] AND cardinality(data_scopes) > 0),
  consent_given boolean NOT NULL CHECK (consent_given = true),
  consent_version text NOT NULL DEFAULT 'v1',
  consent_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','contacting','connected','rejected','revoked')),
  admin_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.external_clinic_link_requests TO authenticated;
GRANT ALL ON public.external_clinic_link_requests TO service_role;
ALTER TABLE public.external_clinic_link_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patients see own clinic link requests" ON public.external_clinic_link_requests
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Patients create own clinic link requests" ON public.external_clinic_link_requests
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND status = 'pending' AND admin_note IS NULL);
CREATE POLICY "Admins update clinic link requests" ON public.external_clinic_link_requests
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Patients may only withdraw consent on their own request.
CREATE OR REPLACE FUNCTION public.revoke_my_clinic_link(_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'unauthorized'; END IF;
  UPDATE public.external_clinic_link_requests SET status = 'revoked', updated_at = now()
  WHERE id = _id AND user_id = auth.uid() AND status <> 'revoked';
END;
$$;
REVOKE ALL ON FUNCTION public.revoke_my_clinic_link(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.revoke_my_clinic_link(uuid) TO authenticated;

CREATE INDEX idx_ext_clinic_link_user ON public.external_clinic_link_requests(user_id, created_at DESC);