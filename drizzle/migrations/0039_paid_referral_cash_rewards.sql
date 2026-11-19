CREATE OR REPLACE FUNCTION public.grant_signup_cash_bonus(_user_id uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE u record; cutoff timestamptz; before_amount numeric; tx uuid;
BEGIN
 IF pg_trigger_depth()=0 AND COALESCE(auth.role(),'')<>'service_role' AND auth.uid() IS DISTINCT FROM _user_id THEN RAISE EXCEPTION 'Forbidden' USING ERRCODE='42501'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended('signup-bonus:'||_user_id::text,0));
 SELECT id,created_at,email_confirmed_at,phone_confirmed_at,is_anonymous INTO u FROM auth.users WHERE id=_user_id;
 SELECT cash_campaign_started_at INTO cutoff FROM public.referral_settings WHERE id=1;
 IF u.id IS NULL OR cutoff IS NULL OR u.created_at<cutoff OR COALESCE(u.is_anonymous,false) OR (u.email_confirmed_at IS NULL AND u.phone_confirmed_at IS NULL) THEN RETURN; END IF;
 INSERT INTO public.cash_wallets(user_id) VALUES(_user_id) ON CONFLICT(user_id) DO NOTHING;
 SELECT balance INTO before_amount FROM public.cash_wallets WHERE user_id=_user_id FOR UPDATE;
 INSERT INTO public.cash_wallet_transactions(user_id,kind,amount,balance_before,balance_after,provider,service_type,idempotency_key,description,metadata)
 VALUES(_user_id,'adjustment',10000,before_amount,before_amount+10000,'referral_bonus','referral','signup-welcome:'||_user_id::text,'Xush kelibsiz — 10 000 so‘m avans bonusi',jsonb_build_object('direction','credit','campaign','signup_cash','referred_user_id',_user_id))
 ON CONFLICT(idempotency_key) DO NOTHING RETURNING id INTO tx;
 IF tx IS NOT NULL THEN
 UPDATE public.cash_wallets SET balance=balance+10000,bonus_balance=bonus_balance+10000,updated_at=now() WHERE user_id=_user_id;
 INSERT INTO public.notifications(user_id,title,message,type,link) VALUES(_user_id,'Avans bonus tushdi','10 000 so‘m xush kelibsiz bonusi. Tarif yoki Med Coin xaridida foydalaning.','wallet','/mobile-profile?section=cash_wallet');
 END IF;
END $$;
REVOKE ALL ON FUNCTION public.grant_signup_cash_bonus(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.grant_signup_cash_bonus(uuid) TO service_role;

CREATE OR REPLACE FUNCTION public.referral_payment_eligible(_status text,_fulfilled timestamptz,_test boolean,_purpose text,_kind text,_amount numeric,_price numeric,_currency text,_package_currency text,_provider text,_wallet_paid numeric,_bonus_used numeric) RETURNS boolean LANGUAGE sql IMMUTABLE SET search_path=public AS $$
SELECT COALESCE(_status IN ('paid','completed') AND _fulfilled IS NOT NULL AND NOT COALESCE(_test,false) AND COALESCE(_purpose,'')<>'cash_wallet_topup' AND _kind IN ('med_coin','subscription') AND _amount>0 AND _amount=_price AND _currency='UZS' AND _currency=_package_currency AND (_provider IN ('click','payme','uzum','stripe') OR (_provider='cash_wallet' AND _wallet_paid=_amount AND _wallet_paid>COALESCE(_bonus_used,0))),false)
$$;
REVOKE ALL ON FUNCTION public.referral_payment_eligible(text,timestamptz,boolean,text,text,numeric,numeric,text,text,text,numeric,numeric) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.referral_payment_eligible(text,timestamptz,boolean,text,text,numeric,numeric,text,text,text,numeric,numeric) TO service_role;

CREATE OR REPLACE FUNCTION public.reward_paid_referral() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE r record; pkg record; wt record; before_amount numeric; tx uuid; legacy_paid boolean;
BEGIN
 IF NEW.fulfilled_at IS NULL OR OLD.fulfilled_at IS NOT NULL OR NEW.user_id IS NULL THEN RETURN NEW; END IF;
 SELECT * INTO pkg FROM public.payment_packages WHERE id=NEW.package_id OR code=NEW.metadata->>'package_code' ORDER BY (id=NEW.package_id) DESC NULLS LAST LIMIT 1;
 SELECT amount,COALESCE((metadata->>'bonus_used')::numeric,0) bonus_used INTO wt FROM public.cash_wallet_transactions WHERE payment_id=NEW.id AND user_id=NEW.user_id AND kind='payment' AND status='completed' LIMIT 1;
 IF NOT public.referral_payment_eligible(NEW.status,NEW.fulfilled_at,NEW.is_test,NEW.purpose,pkg.kind,NEW.amount,pkg.price,NEW.currency,pkg.currency,NEW.provider,wt.amount,wt.bonus_used) THEN RETURN NEW; END IF;
 SELECT * INTO r FROM public.referrals WHERE referred_user_id=NEW.user_id AND referrer_id<>NEW.user_id AND registered_at IS NOT NULL AND status IN ('registered','subscribed','approved') LIMIT 1 FOR UPDATE;
 IF r.id IS NULL OR NOT EXISTS(SELECT 1 FROM auth.users WHERE id=NEW.user_id AND NOT COALESCE(is_anonymous,false) AND (email_confirmed_at IS NOT NULL OR phone_confirmed_at IS NOT NULL)) THEN RETURN NEW; END IF;
 SELECT EXISTS(SELECT 1 FROM public.cash_wallet_transactions WHERE idempotency_key IN ('signup-inviter:'||NEW.user_id::text,'paid-inviter:'||NEW.user_id::text)) INTO legacy_paid;
 IF legacy_paid THEN RETURN NEW; END IF;
 INSERT INTO public.cash_wallets(user_id) VALUES(r.referrer_id) ON CONFLICT(user_id) DO NOTHING;
 SELECT balance INTO before_amount FROM public.cash_wallets WHERE user_id=r.referrer_id FOR UPDATE;
 INSERT INTO public.cash_wallet_transactions(user_id,kind,amount,balance_before,balance_after,provider,service_type,payment_id,idempotency_key,description,metadata)
 VALUES(r.referrer_id,'adjustment',5000,before_amount,before_amount+5000,'referral_bonus','referral',NEW.id,'paid-inviter:'||NEW.user_id::text,'Do‘stingizning pullik xaridi uchun 5 000 so‘m bonus',jsonb_build_object('direction','credit','campaign','paid_referral','referred_user_id',NEW.user_id,'referral_id',r.id)) ON CONFLICT(idempotency_key) DO NOTHING RETURNING id INTO tx;
 IF tx IS NULL THEN RETURN NEW; END IF;
 UPDATE public.cash_wallets SET balance=balance+5000,bonus_balance=bonus_balance+5000,updated_at=now() WHERE user_id=r.referrer_id;
 UPDATE public.referrals SET status='approved',subscribed_at=COALESCE(subscribed_at,now()),approved_at=COALESCE(approved_at,now()),meta=COALESCE(meta,'{}'::jsonb)||jsonb_build_object('cash_reward',5000,'cash_reward_payment_id',NEW.id) WHERE id=r.id;
 INSERT INTO public.notifications(user_id,title,message,type,link) VALUES(r.referrer_id,'Taklifingiz uchun 5 000 so‘m bonus berildi','Do‘stingizning birinchi pullik xaridi tasdiqlandi. Avans kartangizga 5 000 so‘m tushdi. Bonusni tarif yoki Med Coin uchun ishlating.','wallet','/referral');
 BEGIN
 PERFORM net.http_post(url:='https://wiqcfyecdmararxqdmfk.supabase.co/functions/v1/referral-bonus-notify',headers:=jsonb_build_object('Content-Type','application/json','x-job-secret',(SELECT secret FROM public.internal_job_secrets WHERE name='emedinfo_notify')),body:=jsonb_build_object('transaction_id',tx));
 EXCEPTION WHEN OTHERS THEN NULL;
 END;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.reward_paid_referral() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER paid_referral_after_fulfillment AFTER UPDATE OF fulfilled_at ON public.platform_payments FOR EACH ROW EXECUTE FUNCTION public.reward_paid_referral();

CREATE OR REPLACE FUNCTION public.get_my_referral_cash_summary() RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE uid uuid:=auth.uid();
BEGIN
 IF uid IS NULL THEN RAISE EXCEPTION 'unauthorized' USING ERRCODE='42501'; END IF;
 RETURN jsonb_build_object('balance',COALESCE((SELECT balance FROM public.cash_wallets WHERE user_id=uid),0),'bonus_balance',COALESCE((SELECT bonus_balance FROM public.cash_wallets WHERE user_id=uid),0),'rewarded_invites',(SELECT count(*) FROM public.cash_wallet_transactions WHERE user_id=uid AND (idempotency_key LIKE 'signup-inviter:%' OR idempotency_key LIKE 'paid-inviter:%')),'earned',(SELECT COALESCE(sum(amount),0) FROM public.cash_wallet_transactions WHERE user_id=uid AND (idempotency_key LIKE 'signup-inviter:%' OR idempotency_key LIKE 'paid-inviter:%')),'awaiting_payment',(SELECT count(*) FROM public.referrals r WHERE referrer_id=uid AND status IN ('registered','subscribed') AND NOT EXISTS(SELECT 1 FROM public.cash_wallet_transactions t WHERE t.idempotency_key IN ('signup-inviter:'||r.referred_user_id::text,'paid-inviter:'||r.referred_user_id::text))),'welcome_amount',10000,'inviter_amount',5000);
END $$;
REVOKE ALL ON FUNCTION public.get_my_referral_cash_summary() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.get_my_referral_cash_summary() TO authenticated,service_role;