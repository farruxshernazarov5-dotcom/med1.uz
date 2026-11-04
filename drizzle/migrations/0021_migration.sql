ALTER TABLE public.cash_wallet_transactions DROP CONSTRAINT cash_wallet_transactions_kind_check;
ALTER TABLE public.cash_wallet_transactions ADD CONSTRAINT cash_wallet_transactions_kind_check CHECK (kind = ANY (ARRAY['topup','payment','refund','adjustment','transfer_in','transfer_out']));

CREATE OR REPLACE FUNCTION public.cash_wallet_lookup_card(_card text)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE r record; n text;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'unauthorized'; END IF;
  IF _card !~ '^[0-9]{16}$' THEN RETURN jsonb_build_object('ok', false, 'error', 'invalid_card'); END IF;
  SELECT w.user_id, p.full_name INTO r FROM public.cash_wallets w LEFT JOIN public.profiles p ON p.user_id = w.user_id WHERE w.card_number = _card;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok', false, 'error', 'not_found'); END IF;
  IF r.user_id = auth.uid() THEN RETURN jsonb_build_object('ok', false, 'error', 'self'); END IF;
  n := COALESCE(NULLIF(split_part(trim(r.full_name),' ',1),''),'Med ALL') || ' ' || COALESCE(left(NULLIF(split_part(trim(r.full_name),' ',2),''),1) || '.', '');
  RETURN jsonb_build_object('ok', true, 'name', trim(n));
END $$;

CREATE OR REPLACE FUNCTION public.cash_wallet_transfer(_to_card text, _amount numeric, _idempotency_key text, _note text DEFAULT '')
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  uid uuid := auth.uid(); rid uuid; sb numeric; rb numeric; out_id uuid; my_card text; ex public.cash_wallet_transactions%ROWTYPE;
  note text := left(COALESCE(trim(_note),''), 120);
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'unauthorized'; END IF;
  IF _amount IS NULL OR _amount < 1000 OR _amount > 50000000 OR _amount <> round(_amount) THEN RETURN jsonb_build_object('ok', false, 'error', 'invalid_amount'); END IF;
  IF _to_card !~ '^[0-9]{16}$' THEN RETURN jsonb_build_object('ok', false, 'error', 'invalid_card'); END IF;
  IF _idempotency_key IS NULL OR char_length(_idempotency_key) NOT BETWEEN 8 AND 160 THEN RAISE EXCEPTION 'invalid_idempotency_key'; END IF;
  SELECT * INTO ex FROM public.cash_wallet_transactions WHERE idempotency_key = _idempotency_key || ':out';
  IF FOUND THEN
    IF ex.user_id <> uid THEN RAISE EXCEPTION 'idempotency_conflict'; END IF;
    RETURN jsonb_build_object('ok', true, 'already', true, 'transaction_id', ex.id, 'balance', ex.balance_after);
  END IF;
  SELECT user_id INTO rid FROM public.cash_wallets WHERE card_number = _to_card;
  IF rid IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'not_found'); END IF;
  IF rid = uid THEN RETURN jsonb_build_object('ok', false, 'error', 'self'); END IF;
  INSERT INTO public.cash_wallets(user_id) VALUES (uid) ON CONFLICT (user_id) DO NOTHING;
  -- lock both wallets in a stable order to avoid deadlocks
  PERFORM 1 FROM public.cash_wallets WHERE user_id IN (uid, rid) ORDER BY user_id FOR UPDATE;
  SELECT balance, card_number INTO sb, my_card FROM public.cash_wallets WHERE user_id = uid;
  SELECT balance INTO rb FROM public.cash_wallets WHERE user_id = rid;
  IF sb < _amount THEN RETURN jsonb_build_object('ok', false, 'error', 'insufficient_balance', 'balance', sb); END IF;
  INSERT INTO public.cash_wallet_transactions(user_id, kind, amount, balance_before, balance_after, service_type, service_reference, idempotency_key, description, provider, metadata)
  VALUES (uid, 'transfer_out', _amount, sb, sb - _amount, 'p2p', '****' || right(_to_card,4), _idempotency_key || ':out', COALESCE(NULLIF(note,''), 'Kartaga o‘tkazma'), 'med_all', jsonb_build_object('to_card_last4', right(_to_card,4)))
  RETURNING id INTO out_id;
  INSERT INTO public.cash_wallet_transactions(user_id, kind, amount, balance_before, balance_after, service_type, service_reference, idempotency_key, description, provider, metadata)
  VALUES (rid, 'transfer_in', _amount, rb, rb + _amount, 'p2p', out_id::text, _idempotency_key || ':in', COALESCE(NULLIF(note,''), 'Kartaga o‘tkazma'), 'med_all', jsonb_build_object('from_card_last4', right(my_card,4), 'transfer_id', out_id));
  UPDATE public.cash_wallets SET balance = sb - _amount, updated_at = now() WHERE user_id = uid;
  UPDATE public.cash_wallets SET balance = rb + _amount, updated_at = now() WHERE user_id = rid;
  INSERT INTO public.notifications(user_id, title, message, type, link) VALUES
    (rid, 'Hisob to‘ldirildi', to_char(_amount,'FM999G999G999') || ' so‘m kartangizga o‘tkazildi (•••• ' || right(my_card,4) || ')', 'wallet', '/mobile-profile?section=cash_wallet'),
    (uid, 'O‘tkazma bajarildi', to_char(_amount,'FM999G999G999') || ' so‘m •••• ' || right(_to_card,4) || ' kartaga yuborildi', 'wallet', '/mobile-profile?section=cash_wallet');
  RETURN jsonb_build_object('ok', true, 'transaction_id', out_id, 'balance', sb - _amount);
END $$;

REVOKE ALL ON FUNCTION public.cash_wallet_transfer(text, numeric, text, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.cash_wallet_lookup_card(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.cash_wallet_transfer(text, numeric, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cash_wallet_lookup_card(text) TO authenticated;