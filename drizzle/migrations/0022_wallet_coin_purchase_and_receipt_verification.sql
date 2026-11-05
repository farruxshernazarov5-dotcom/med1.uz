CREATE UNIQUE INDEX IF NOT EXISTS platform_wallet_purchase_key_idx ON public.platform_payments (user_id, (metadata->>'wallet_purchase_key')) WHERE provider='cash_wallet' AND metadata ? 'wallet_purchase_key';
CREATE OR REPLACE FUNCTION public.purchase_medcoin_from_wallet(_package_code text, _idempotency_key text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE uid uuid:=auth.uid(); pkg public.payment_packages%ROWTYPE; bal numeric; pid uuid; result jsonb; previous public.platform_payments%ROWTYPE;
BEGIN
 IF uid IS NULL THEN RAISE EXCEPTION 'unauthorized'; END IF;
 IF _idempotency_key IS NULL OR char_length(_idempotency_key) NOT BETWEEN 8 AND 160 THEN RAISE EXCEPTION 'invalid_idempotency_key'; END IF;
 SELECT balance INTO bal FROM public.cash_wallets WHERE user_id=uid FOR UPDATE;
 IF NOT FOUND THEN RETURN jsonb_build_object('ok',false,'error','insufficient_balance'); END IF;
 SELECT * INTO previous FROM public.platform_payments WHERE user_id=uid AND provider='cash_wallet' AND metadata->>'wallet_purchase_key'=_idempotency_key;
 IF FOUND THEN
  IF previous.metadata->>'package_code' IS DISTINCT FROM _package_code THEN RAISE EXCEPTION 'idempotency_conflict'; END IF;
  RETURN jsonb_build_object('ok',true,'already',true,'payment_id',previous.id,'balance',bal,'coins',previous.metadata->'coins_granted');
 END IF;
 SELECT * INTO pkg FROM public.payment_packages WHERE code=_package_code AND is_active AND kind='med_coin' FOR SHARE;
 IF NOT FOUND OR pkg.currency<>'UZS' OR pkg.price<=0 OR pkg.duration_days<=0 OR (pkg.coin_amount+pkg.bonus_coins)<=0 THEN RETURN jsonb_build_object('ok',false,'error','invalid_package'); END IF;
 IF bal<pkg.price THEN RETURN jsonb_build_object('ok',false,'error','insufficient_balance','balance',bal); END IF;
 INSERT INTO public.platform_payments(user_id,provider,amount,currency,status,purpose,package_id,paid_at,metadata)
 VALUES(uid,'cash_wallet',pkg.price,pkg.currency,'paid','ai_credits:'||pkg.code,pkg.id,now(),jsonb_build_object('wallet_purchase_key',_idempotency_key,'package_code',pkg.code)) RETURNING id INTO pid;
 INSERT INTO public.cash_wallet_transactions(user_id,kind,amount,balance_before,balance_after,provider,payment_id,idempotency_key,description,service_type)
 VALUES(uid,'payment',pkg.price,bal,bal-pkg.price,'cash_wallet',pid,'medcoin:'||pid::text,pkg.name_uz||' — Med Coin xaridi','med_coin');
 UPDATE public.cash_wallets SET balance=bal-pkg.price,updated_at=now() WHERE user_id=uid;
 result:=public.fulfill_platform_payment(pid);
 IF NOT COALESCE((result->>'ok')::boolean,false) THEN RAISE EXCEPTION 'fulfillment_failed'; END IF;
 INSERT INTO public.notifications(user_id,title,message,type,link) VALUES(uid,'Med Coin xarid qilindi',(pkg.coin_amount+pkg.bonus_coins)::text||' Med Coin avans kartangiz orqali xarid qilindi','wallet','/mobile-profile?section=wallet');
 RETURN jsonb_build_object('ok',true,'payment_id',pid,'balance',bal-pkg.price,'coins',pkg.coin_amount+pkg.bonus_coins,'duration_days',pkg.duration_days);
END $$;
REVOKE ALL ON FUNCTION public.purchase_medcoin_from_wallet(text,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.purchase_medcoin_from_wallet(text,text) TO authenticated;

CREATE OR REPLACE FUNCTION public.verify_payment_receipt(_id uuid) RETURNS TABLE(id uuid,amount numeric,currency text,status text,purpose text,provider text,paid_at timestamptz,created_at timestamptz) LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT p.id,p.amount,p.currency,p.status,p.purpose,p.provider,p.paid_at,p.created_at FROM public.platform_payments p WHERE p.id=_id AND NOT COALESCE(p.is_test,false)
 UNION ALL
 SELECT t.id,t.amount,'UZS'::text,t.status,'cash_wallet_'||t.kind,COALESCE(t.provider,'med_all'),t.created_at,t.created_at FROM public.cash_wallet_transactions t WHERE t.id=_id AND NOT EXISTS(SELECT 1 FROM public.platform_payments p WHERE p.id=_id) LIMIT 1;
$$;
REVOKE ALL ON FUNCTION public.verify_payment_receipt(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.verify_payment_receipt(uuid) TO anon,authenticated,service_role;
COMMENT ON FUNCTION public.verify_payment_receipt(uuid) IS 'Receipt bearer UUID lookup only; excludes payer identity, card numbers, descriptions and balances. No enumerable table access.';