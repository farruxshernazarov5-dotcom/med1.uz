ALTER TABLE public.cash_wallets ADD COLUMN IF NOT EXISTS bonus_balance numeric NOT NULL DEFAULT 0;
ALTER TABLE public.referral_settings ADD COLUMN IF NOT EXISTS cash_campaign_started_at timestamptz NOT NULL DEFAULT now();
CREATE UNIQUE INDEX IF NOT EXISTS referrals_one_inviter_per_user ON public.referrals(referred_user_id) WHERE referred_user_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.guard_cash_bonus_usage() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE b numeric; total numeric; used numeric; original_bonus numeric;
BEGIN
  SELECT balance,bonus_balance INTO total,b FROM public.cash_wallets WHERE user_id=NEW.user_id FOR UPDATE;
  IF NEW.kind='transfer_out' AND NEW.amount>COALESCE(total-b,0) THEN
    RAISE EXCEPTION 'bonus_not_transferable' USING ERRCODE='42501';
  ELSIF NEW.kind='payment' THEN
    used:=LEAST(COALESCE(b,0),NEW.amount);
    NEW.metadata:=COALESCE(NEW.metadata,'{}'::jsonb)||jsonb_build_object('bonus_used',used);
    UPDATE public.cash_wallets SET bonus_balance=bonus_balance-used WHERE user_id=NEW.user_id;
  ELSIF NEW.kind='refund' THEN
    SELECT COALESCE((metadata->>'bonus_used')::numeric,0) INTO original_bonus FROM public.cash_wallet_transactions
      WHERE id::text=NEW.metadata->>'original_transaction_id' AND user_id=NEW.user_id AND kind='payment';
    IF COALESCE(original_bonus,0)>0 THEN
      UPDATE public.cash_wallets SET bonus_balance=bonus_balance+LEAST(original_bonus,NEW.amount) WHERE user_id=NEW.user_id;
    END IF;
  END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.guard_cash_bonus_usage() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER cash_bonus_usage BEFORE INSERT ON public.cash_wallet_transactions FOR EACH ROW EXECUTE FUNCTION public.guard_cash_bonus_usage();

CREATE OR REPLACE FUNCTION public.grant_signup_cash_bonus(_user_id uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE u record; r record; cutoff timestamptz; before_amount numeric; tx uuid; recipient uuid; amount_to_add numeric; key_text text; label_text text;
BEGIN
  IF pg_trigger_depth()=0 AND COALESCE(auth.role(),'')<>'service_role' AND auth.uid() IS DISTINCT FROM _user_id THEN RAISE EXCEPTION 'Forbidden' USING ERRCODE='42501'; END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended('signup-bonus:'||_user_id::text,0));
  SELECT id,created_at,email_confirmed_at,phone_confirmed_at,is_anonymous INTO u FROM auth.users WHERE id=_user_id;
  SELECT cash_campaign_started_at INTO cutoff FROM public.referral_settings WHERE id=1;
  IF u.id IS NULL OR cutoff IS NULL OR u.created_at<cutoff OR COALESCE(u.is_anonymous,false) OR (u.email_confirmed_at IS NULL AND u.phone_confirmed_at IS NULL) THEN RETURN; END IF;
  SELECT * INTO r FROM public.referrals WHERE referred_user_id=_user_id AND status NOT IN ('fraud','rejected','cancelled','expired','pending') LIMIT 1 FOR UPDATE;
  -- Lock all participating wallets in the same order as P2P transfers.
  INSERT INTO public.cash_wallets(user_id) VALUES(_user_id) ON CONFLICT(user_id) DO NOTHING;
  IF r.referrer_id IS NOT NULL AND r.referrer_id<>_user_id THEN
    INSERT INTO public.cash_wallets(user_id) VALUES(r.referrer_id) ON CONFLICT(user_id) DO NOTHING;
  END IF;
  PERFORM 1 FROM public.cash_wallets WHERE user_id IN (_user_id,r.referrer_id) ORDER BY user_id FOR UPDATE;
  FOR recipient,amount_to_add,key_text,label_text IN
    SELECT _user_id,10000::numeric,'signup-welcome:'||_user_id::text,'Xush kelibsiz — 10 000 so‘m avans bonusi'
    UNION ALL
    SELECT r.referrer_id,5000::numeric,'signup-inviter:'||_user_id::text,'Taklif uchun 5 000 so‘m avans bonusi'
    WHERE r.referrer_id IS NOT NULL AND r.referrer_id<>_user_id
  LOOP
    IF EXISTS(SELECT 1 FROM public.cash_wallet_transactions WHERE idempotency_key=key_text) THEN CONTINUE; END IF;
    SELECT balance INTO before_amount FROM public.cash_wallets WHERE user_id=recipient;
    INSERT INTO public.cash_wallet_transactions(user_id,kind,amount,balance_before,balance_after,provider,service_type,idempotency_key,description,metadata)
    VALUES(recipient,'adjustment',amount_to_add,before_amount,before_amount+amount_to_add,'referral_bonus','referral',key_text,label_text,jsonb_build_object('direction','credit','campaign','signup_cash','referred_user_id',_user_id))
    ON CONFLICT(idempotency_key) DO NOTHING RETURNING id INTO tx;
    IF tx IS NOT NULL THEN
      UPDATE public.cash_wallets SET balance=balance+amount_to_add,bonus_balance=bonus_balance+amount_to_add,updated_at=now() WHERE user_id=recipient;
      INSERT INTO public.notifications(user_id,title,message,type,link) VALUES(recipient,'Avans bonus tushdi',label_text||'. Tarif yoki Med Coin xaridida foydalaning.','wallet','/mobile-profile?section=cash_wallet');
    END IF;
  END LOOP;
END $$;
REVOKE ALL ON FUNCTION public.grant_signup_cash_bonus(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.grant_signup_cash_bonus(uuid) TO service_role;

CREATE OR REPLACE FUNCTION public.signup_cash_bonus_on_auth() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  PERFORM public.grant_signup_cash_bonus(NEW.id);
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.signup_cash_bonus_on_auth() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER zz_signup_cash_bonus AFTER INSERT OR UPDATE OF email_confirmed_at,phone_confirmed_at ON auth.users FOR EACH ROW EXECUTE FUNCTION public.signup_cash_bonus_on_auth();

CREATE OR REPLACE FUNCTION public.claim_my_signup_bonus(_code text DEFAULT NULL) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE uid uuid:=auth.uid(); u record; rc record; cutoff timestamptz;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'unauthorized' USING ERRCODE='42501'; END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended('signup-bonus:'||uid::text,0));
  SELECT id,created_at,email_confirmed_at,phone_confirmed_at INTO u FROM auth.users WHERE id=uid;
  SELECT cash_campaign_started_at INTO cutoff FROM public.referral_settings WHERE id=1;
  IF u.created_at>=cutoff AND u.created_at>now()-interval '30 days' AND (u.email_confirmed_at IS NOT NULL OR u.phone_confirmed_at IS NOT NULL)
    AND _code IS NOT NULL AND upper(trim(_code)) ~ '^[A-Z0-9_-]{4,32}$'
    AND NOT EXISTS(SELECT 1 FROM public.referrals WHERE referred_user_id=uid) THEN
    SELECT * INTO rc FROM public.referral_codes WHERE code=upper(trim(_code)) AND is_active AND owner_id<>uid LIMIT 1;
    IF rc.id IS NOT NULL THEN
      INSERT INTO public.referrals(code_id,code_text,referrer_id,referred_user_id,status,registered_at,meta)
      VALUES(rc.id,rc.code,rc.owner_id,uid,'registered',now(),jsonb_build_object('source','confirmed_signup')) ON CONFLICT DO NOTHING;
      IF FOUND THEN UPDATE public.referral_codes SET total_signups=total_signups+1,updated_at=now() WHERE id=rc.id; END IF;
    END IF;
  END IF;
  PERFORM public.grant_signup_cash_bonus(uid);
  RETURN jsonb_build_object('ok',true,'eligible',u.created_at>=cutoff,'welcome_paid',EXISTS(SELECT 1 FROM public.cash_wallet_transactions WHERE idempotency_key='signup-welcome:'||uid::text));
END $$;
REVOKE ALL ON FUNCTION public.claim_my_signup_bonus(text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.claim_my_signup_bonus(text) TO authenticated,service_role;

CREATE OR REPLACE FUNCTION public.get_my_referral_cash_summary() RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE uid uuid:=auth.uid();
BEGIN
 IF uid IS NULL THEN RAISE EXCEPTION 'unauthorized' USING ERRCODE='42501'; END IF;
 RETURN jsonb_build_object(
 'balance',COALESCE((SELECT balance FROM public.cash_wallets WHERE user_id=uid),0),
 'bonus_balance',COALESCE((SELECT bonus_balance FROM public.cash_wallets WHERE user_id=uid),0),
 'rewarded_invites',(SELECT count(*) FROM public.cash_wallet_transactions WHERE user_id=uid AND idempotency_key LIKE 'signup-inviter:%'),
 'earned',(SELECT COALESCE(sum(amount),0) FROM public.cash_wallet_transactions WHERE user_id=uid AND idempotency_key LIKE 'signup-inviter:%'),
 'welcome_amount',10000,'inviter_amount',5000);
END $$;
REVOKE ALL ON FUNCTION public.get_my_referral_cash_summary() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.get_my_referral_cash_summary() TO authenticated,service_role;

CREATE OR REPLACE FUNCTION public.purchase_wallet_package(_package_code text,_idempotency_key text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE uid uuid:=auth.uid(); pkg public.payment_packages%ROWTYPE; bal numeric; pid uuid; result jsonb; prev public.platform_payments%ROWTYPE;
BEGIN
 IF uid IS NULL THEN RAISE EXCEPTION 'unauthorized'; END IF;
 IF _idempotency_key IS NULL OR char_length(_idempotency_key) NOT BETWEEN 8 AND 160 THEN RAISE EXCEPTION 'invalid_idempotency_key'; END IF;
 SELECT balance INTO bal FROM public.cash_wallets WHERE user_id=uid FOR UPDATE;
 IF NOT FOUND THEN RETURN jsonb_build_object('ok',false,'error','insufficient_balance'); END IF;
 SELECT * INTO prev FROM public.platform_payments WHERE user_id=uid AND provider='cash_wallet' AND metadata->>'wallet_purchase_key'=_idempotency_key;
 IF FOUND THEN
   IF prev.metadata->>'package_code' IS DISTINCT FROM _package_code THEN RAISE EXCEPTION 'idempotency_conflict'; END IF;
   RETURN jsonb_build_object('ok',true,'already',true,'payment_id',prev.id,'balance',bal);
 END IF;
 SELECT * INTO pkg FROM public.payment_packages WHERE code=_package_code AND is_active AND kind IN ('med_coin','subscription') FOR SHARE;
 IF NOT FOUND OR pkg.currency<>'UZS' OR pkg.price<=0 OR pkg.duration_days<=0 THEN RETURN jsonb_build_object('ok',false,'error','invalid_package'); END IF;
 IF bal<pkg.price THEN RETURN jsonb_build_object('ok',false,'error','insufficient_balance','balance',bal); END IF;
 INSERT INTO public.platform_payments(user_id,provider,amount,currency,status,purpose,package_id,paid_at,metadata)
 VALUES(uid,'cash_wallet',pkg.price,pkg.currency,'paid',CASE WHEN pkg.kind='subscription' THEN 'ai_subscription:' ELSE 'ai_credits:' END||pkg.code,pkg.id,now(),jsonb_build_object('wallet_purchase_key',_idempotency_key,'package_code',pkg.code)) RETURNING id INTO pid;
 INSERT INTO public.cash_wallet_transactions(user_id,kind,amount,balance_before,balance_after,provider,payment_id,idempotency_key,description,service_type)
 VALUES(uid,'payment',pkg.price,bal,bal-pkg.price,'cash_wallet',pid,'wallet-package:'||pid::text,pkg.name_uz||' — avans kartadan xarid',pkg.kind);
 UPDATE public.cash_wallets SET balance=bal-pkg.price,updated_at=now() WHERE user_id=uid;
 result:=public.fulfill_platform_payment(pid);
 IF NOT COALESCE((result->>'ok')::boolean,false) THEN RAISE EXCEPTION 'fulfillment_failed'; END IF;
 INSERT INTO public.notifications(user_id,title,message,type,link) VALUES(uid,'Xarid bajarildi',pkg.name_uz||' avans kartangiz orqali xarid qilindi','wallet','/mobile-profile?section=wallet');
 RETURN jsonb_build_object('ok',true,'payment_id',pid,'balance',bal-pkg.price,'coins',pkg.coin_amount+pkg.bonus_coins,'duration_days',pkg.duration_days);
END $$;
REVOKE ALL ON FUNCTION public.purchase_wallet_package(text,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.purchase_wallet_package(text,text) TO authenticated,service_role;