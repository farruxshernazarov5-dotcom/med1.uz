DROP POLICY IF EXISTS "Patients can create appointments" ON public.appointments;
CREATE POLICY "Patients can create appointments" ON public.appointments FOR INSERT TO authenticated
WITH CHECK (auth.uid() = patient_id AND COALESCE(status, 'pending') = 'pending');

CREATE OR REPLACE FUNCTION public.cash_wallet_lookup_card(_card text)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE rid uuid;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'unauthorized'; END IF;
  IF _card !~ '^[0-9]{16}$' THEN RETURN jsonb_build_object('ok', false, 'error', 'invalid_card'); END IF;
  SELECT w.user_id INTO rid FROM public.cash_wallets w WHERE w.card_number = _card;
  IF rid IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'not_found'); END IF;
  IF rid = auth.uid() THEN RETURN jsonb_build_object('ok', false, 'error', 'self'); END IF;
  RETURN jsonb_build_object('ok', true, 'name', 'Med ALL karta ****' || right(_card, 4));
END $$;