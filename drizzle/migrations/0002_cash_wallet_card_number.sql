CREATE OR REPLACE FUNCTION public.generate_wallet_card_number()
RETURNS text LANGUAGE plpgsql SET search_path = public AS $$
DECLARE base text; s int; i int; d int; chk int; candidate text;
BEGIN
  LOOP
    base := '7700' || lpad((floor(random()*1e11))::bigint::text, 11, '0');
    s := 0;
    FOR i IN 1..15 LOOP
      d := substr(base, 16 - i, 1)::int;
      IF i % 2 = 1 THEN d := d * 2; IF d > 9 THEN d := d - 9; END IF; END IF;
      s := s + d;
    END LOOP;
    chk := (10 - (s % 10)) % 10;
    candidate := base || chk::text;
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.cash_wallets WHERE card_number = candidate);
  END LOOP;
  RETURN candidate;
END $$;

ALTER TABLE public.cash_wallets ADD COLUMN IF NOT EXISTS card_number text;
UPDATE public.cash_wallets SET card_number = public.generate_wallet_card_number() WHERE card_number IS NULL;
ALTER TABLE public.cash_wallets ALTER COLUMN card_number SET DEFAULT public.generate_wallet_card_number();
ALTER TABLE public.cash_wallets ALTER COLUMN card_number SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS cash_wallets_card_number_key ON public.cash_wallets(card_number);

CREATE OR REPLACE FUNCTION public.ensure_my_cash_wallet()
RETURNS TABLE(balance numeric, card_number text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  INSERT INTO public.cash_wallets(user_id) VALUES (auth.uid()) ON CONFLICT (user_id) DO NOTHING;
  RETURN QUERY SELECT w.balance, w.card_number FROM public.cash_wallets w WHERE w.user_id = auth.uid();
END $$;
REVOKE ALL ON FUNCTION public.ensure_my_cash_wallet() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.ensure_my_cash_wallet() TO authenticated;
REVOKE ALL ON FUNCTION public.generate_wallet_card_number() FROM public, anon, authenticated;