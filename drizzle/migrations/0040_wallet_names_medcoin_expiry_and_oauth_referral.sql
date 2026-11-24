-- 1. Show real cardholder names in lookup and P2P card transfers
CREATE OR REPLACE FUNCTION public.cash_wallet_lookup_card(_card text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  rid uuid;
  rname text;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'unauthorized'; END IF;
  IF _card !~ '^[0-9]{16}$' THEN RETURN jsonb_build_object('ok', false, 'error', 'invalid_card'); END IF;
  SELECT w.user_id INTO rid FROM public.cash_wallets w WHERE w.card_number = _card;
  IF rid IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'not_found'); END IF;
  IF rid = auth.uid() THEN RETURN jsonb_build_object('ok', false, 'error', 'self'); END IF;

  SELECT COALESCE(
    NULLIF(trim(p.full_name), ''),
    NULLIF(trim(u.raw_user_meta_data->>'full_name'), ''),
    NULLIF(trim(u.raw_user_meta_data->>'name'), ''),
    CASE WHEN u.email IS NOT NULL THEN split_part(u.email, '@', 1) ELSE NULL END,
    'Med ALL foydalanuvchisi'
  ) INTO rname
  FROM auth.users u
  LEFT JOIN public.profiles p ON p.user_id = u.id
  WHERE u.id = rid;

  RETURN jsonb_build_object(
    'ok', true,
    'name', COALESCE(rname, 'Med ALL foydalanuvchisi'),
    'card_last4', right(_card, 4)
  );
END $function$;

CREATE OR REPLACE FUNCTION public.cash_wallet_transfer(_to_card text, _amount numeric, _idempotency_key text, _note text DEFAULT ''::text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  uid uuid := auth.uid();
  rid uuid;
  sb numeric;
  rb numeric;
  out_id uuid;
  my_card text;
  ex public.cash_wallet_transactions%ROWTYPE;
  note text := left(COALESCE(trim(_note), ''), 120);
  sender_name text;
  recipient_name text;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'unauthorized'; END IF;
  IF _amount IS NULL OR _amount < 1000 OR _amount > 50000000 OR _amount <> round(_amount) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_amount');
  END IF;
  IF _to_card !~ '^[0-9]{16}$' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_card');
  END IF;
  IF _idempotency_key IS NULL OR char_length(_idempotency_key) NOT BETWEEN 8 AND 160 THEN
    RAISE EXCEPTION 'invalid_idempotency_key';
  END IF;

  SELECT * INTO ex FROM public.cash_wallet_transactions WHERE idempotency_key = _idempotency_key || ':out';
  IF FOUND THEN
    IF ex.user_id <> uid THEN RAISE EXCEPTION 'idempotency_conflict'; END IF;
    RETURN jsonb_build_object('ok', true, 'already', true, 'transaction_id', ex.id, 'balance', ex.balance_after);
  END IF;

  SELECT user_id INTO rid FROM public.cash_wallets WHERE card_number = _to_card;
  IF rid IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'not_found'); END IF;
  IF rid = uid THEN RETURN jsonb_build_object('ok', false, 'error', 'self'); END IF;

  INSERT INTO public.cash_wallets(user_id) VALUES (uid) ON CONFLICT (user_id) DO NOTHING;
  PERFORM 1 FROM public.cash_wallets WHERE user_id IN (uid, rid) ORDER BY user_id FOR UPDATE;
  SELECT balance, card_number INTO sb, my_card FROM public.cash_wallets WHERE user_id = uid;
  SELECT balance INTO rb FROM public.cash_wallets WHERE user_id = rid;
  IF sb < _amount THEN
    RETURN jsonb_build_object('ok', false, 'error', 'insufficient_balance', 'balance', sb);
  END IF;

  SELECT COALESCE(
    NULLIF(trim(p.full_name), ''),
    NULLIF(trim(u.raw_user_meta_data->>'full_name'), ''),
    NULLIF(trim(u.raw_user_meta_data->>'name'), ''),
    CASE WHEN u.email IS NOT NULL THEN split_part(u.email, '@', 1) ELSE NULL END,
    'Med ALL foydalanuvchisi'
  ) INTO sender_name
  FROM auth.users u LEFT JOIN public.profiles p ON p.user_id = u.id WHERE u.id = uid;

  SELECT COALESCE(
    NULLIF(trim(p.full_name), ''),
    NULLIF(trim(u.raw_user_meta_data->>'full_name'), ''),
    NULLIF(trim(u.raw_user_meta_data->>'name'), ''),
    CASE WHEN u.email IS NOT NULL THEN split_part(u.email, '@', 1) ELSE NULL END,
    'Med ALL foydalanuvchisi'
  ) INTO recipient_name
  FROM auth.users u LEFT JOIN public.profiles p ON p.user_id = u.id WHERE u.id = rid;

  sender_name := COALESCE(sender_name, 'Med ALL foydalanuvchisi');
  recipient_name := COALESCE(recipient_name, 'Med ALL foydalanuvchisi');

  INSERT INTO public.cash_wallet_transactions(
    user_id, kind, amount, balance_before, balance_after, service_type, service_reference, idempotency_key, description, provider, metadata
  ) VALUES (
    uid, 'transfer_out', _amount, sb, sb - _amount, 'p2p', '****' || right(_to_card, 4), _idempotency_key || ':out',
    CASE WHEN note <> '' THEN recipient_name || ' — ' || note ELSE 'O‘tkazma: ' || recipient_name END,
    'med_all',
    jsonb_build_object(
      'to_card_last4', right(_to_card, 4),
      'to_name', recipient_name,
      'from_card_last4', right(my_card, 4),
      'from_name', sender_name,
      'note', NULLIF(note, '')
    )
  ) RETURNING id INTO out_id;

  INSERT INTO public.cash_wallet_transactions(
    user_id, kind, amount, balance_before, balance_after, service_type, service_reference, idempotency_key, description, provider, metadata
  ) VALUES (
    rid, 'transfer_in', _amount, rb, rb + _amount, 'p2p', out_id::text, _idempotency_key || ':in',
    CASE WHEN note <> '' THEN sender_name || ' — ' || note ELSE 'O‘tkazma: ' || sender_name END,
    'med_all',
    jsonb_build_object(
      'from_card_last4', right(my_card, 4),
      'from_name', sender_name,
      'to_card_last4', right(_to_card, 4),
      'to_name', recipient_name,
      'transfer_id', out_id,
      'note', NULLIF(note, '')
    )
  );

  UPDATE public.cash_wallets SET balance = sb - _amount, updated_at = now() WHERE user_id = uid;
  UPDATE public.cash_wallets SET balance = rb + _amount, updated_at = now() WHERE user_id = rid;

  INSERT INTO public.notifications(user_id, title, message, type, link) VALUES
    (rid, 'Kartaga o‘tkazma keldi', sender_name || ' (•••• ' || right(my_card, 4) || ') kartangizga ' || to_char(_amount, 'FM999G999G999') || ' so‘m o‘tkazdi', 'wallet', '/mobile-profile?section=cash_wallet'),
    (uid, 'O‘tkazma bajarildi', recipient_name || ' (•••• ' || right(_to_card, 4) || ') kartasiga ' || to_char(_amount, 'FM999G999G999') || ' so‘m yuborildi', 'wallet', '/mobile-profile?section=cash_wallet');

  RETURN jsonb_build_object(
    'ok', true,
    'transaction_id', out_id,
    'balance', sb - _amount,
    'recipient_name', recipient_name,
    'sender_name', sender_name
  );
END $function$;

-- 2. Strict Med Coin expiration & proactive expiry notifications
CREATE OR REPLACE FUNCTION public.expire_and_notify_med_coins(_user_id uuid DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_rec record;
  v_bal_after integer;
  v_expired_lots integer := 0;
  v_expired_coins integer := 0;
  v_warnings integer := 0;
  v_hours_left numeric;
  v_tag text;
  v_label text;
  v_notif_type text;
  v_pkg text;
BEGIN
  IF _user_id IS NULL THEN
    IF current_user NOT IN ('postgres', 'supabase_admin')
       AND auth.role() <> 'service_role'
       AND NOT public.has_role(auth.uid(), 'admin') THEN
      RAISE EXCEPTION 'forbidden';
    END IF;
  ELSE
    IF current_user NOT IN ('postgres', 'supabase_admin')
       AND auth.role() <> 'service_role'
       AND auth.uid() IS DISTINCT FROM _user_id
       AND NOT public.has_role(auth.uid(), 'admin') THEN
      RAISE EXCEPTION 'forbidden';
    END IF;
  END IF;

  -- A) Strictly burn expired coin batches and log + notify
  FOR v_rec IN
    SELECT id, user_id, balance, expires_at, package_name
    FROM public.user_credits
    WHERE balance > 0
      AND expires_at <= now()
      AND (_user_id IS NULL OR user_id = _user_id)
    FOR UPDATE SKIP LOCKED
  LOOP
    UPDATE public.user_credits
      SET balance = 0, updated_at = now()
      WHERE id = v_rec.id;

    SELECT COALESCE(SUM(balance), 0) INTO v_bal_after
      FROM public.user_credits
      WHERE user_id = v_rec.user_id AND expires_at > now() AND balance > 0;

    v_pkg := COALESCE(NULLIF(trim(v_rec.package_name), ''), 'Med Coin paketi');

    INSERT INTO public.credit_history(user_id, amount, type, service_id, description, balance_after)
    VALUES (
      v_rec.user_id,
      -v_rec.balance,
      'expired',
      NULL,
      format('Muddati tugagan %s Med Coin kuydi (%s)', v_rec.balance, v_pkg),
      v_bal_after
    );

    INSERT INTO public.notifications(user_id, title, message, type, link)
    VALUES (
      v_rec.user_id,
      'Med Coin muddati tugadi',
      format('%s ta Med Coin (%s) muddati %s da tugagani sababli kuydi. Faol balans: %s Med Coin.',
        v_rec.balance,
        v_pkg,
        to_char(v_rec.expires_at AT TIME ZONE 'Asia/Tashkent', 'DD.MM.YYYY HH24:MI'),
        v_bal_after
      ),
      'medcoin_expired',
      '/dashboard?tab=wallet'
    );

    v_expired_lots := v_expired_lots + 1;
    v_expired_coins := v_expired_coins + v_rec.balance;
  END LOOP;

  -- B) Proactive upcoming expiry alerts (7d, 3d, 1d)
  FOR v_rec IN
    SELECT id, user_id, balance, expires_at, package_name
    FROM public.user_credits
    WHERE balance > 0
      AND expires_at > now()
      AND expires_at <= now() + interval '7 days'
      AND (_user_id IS NULL OR user_id = _user_id)
  LOOP
    v_hours_left := EXTRACT(EPOCH FROM (v_rec.expires_at - now())) / 3600.0;
    IF v_hours_left <= 24 THEN
      v_tag := '1d';
      v_label := '1 kundan kam qoldi';
    ELSIF v_hours_left <= 72 THEN
      v_tag := '3d';
      v_label := '3 kundan kam qoldi';
    ELSE
      v_tag := '7d';
      v_label := '7 kundan kam qoldi';
    END IF;

    v_notif_type := 'medcoin_expiring_' || v_tag || '_' || left(v_rec.id::text, 8);
    IF NOT EXISTS (
      SELECT 1 FROM public.notifications
      WHERE user_id = v_rec.user_id AND type = v_notif_type
    ) THEN
      v_pkg := COALESCE(NULLIF(trim(v_rec.package_name), ''), 'Med Coin paketi');
      INSERT INTO public.notifications(user_id, title, message, type, link)
      VALUES (
        v_rec.user_id,
        format('Med Coin muddati tugayapti (%s)', v_label),
        format('%s ta Med Coin (%s) %s gacha amal qiladi. Vaqtida foydalanmasangiz kuyib ketadi.',
          v_rec.balance,
          v_pkg,
          to_char(v_rec.expires_at AT TIME ZONE 'Asia/Tashkent', 'DD.MM.YYYY HH24:MI')
        ),
        v_notif_type,
        '/dashboard?tab=wallet'
      );
      v_warnings := v_warnings + 1;
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'ok', true,
    'expired_lots', v_expired_lots,
    'expired_coins', v_expired_coins,
    'warnings_sent', v_warnings
  );
END $function$;

GRANT EXECUTE ON FUNCTION public.expire_and_notify_med_coins(uuid) TO authenticated, service_role;

-- Update deduct_ai_credits to enforce expiry and trigger server-side low-balance alerts immediately
CREATE OR REPLACE FUNCTION public.deduct_ai_credits(_user_id uuid, _service_id text, _cost integer, _channel text DEFAULT 'web'::text, _model text DEFAULT NULL::text)
RETURNS TABLE(success boolean, balance_after integer, error text, usage_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_total integer := 0;
  v_after integer := 0;
  v_remaining integer;
  v_credit record;
  v_usage_id uuid;
  v_recent_in integer := 0;
  v_pct numeric;
  v_thr integer := NULL;
  v_type text;
  v_title text;
  v_msg text;
BEGIN
  PERFORM public.expire_and_notify_med_coins(_user_id);

  PERFORM 1 FROM public.user_credits
    WHERE user_id = _user_id AND expires_at > now() AND balance > 0
    FOR UPDATE;

  SELECT COALESCE(SUM(balance), 0) INTO v_total
    FROM public.user_credits
    WHERE user_id = _user_id AND expires_at > now() AND balance > 0;

  IF v_total < _cost THEN
    RETURN QUERY SELECT false, v_total, format('Kredit yetarli emas. Kerak: %s, balans: %s', _cost, v_total), NULL::uuid;
    RETURN;
  END IF;

  v_remaining := _cost;
  FOR v_credit IN
    SELECT id, balance FROM public.user_credits
    WHERE user_id = _user_id AND expires_at > now() AND balance > 0
    ORDER BY expires_at ASC
  LOOP
    EXIT WHEN v_remaining <= 0;
    IF v_credit.balance >= v_remaining THEN
      UPDATE public.user_credits SET balance = balance - v_remaining, updated_at = now() WHERE id = v_credit.id;
      v_remaining := 0;
    ELSE
      v_remaining := v_remaining - v_credit.balance;
      UPDATE public.user_credits SET balance = 0, updated_at = now() WHERE id = v_credit.id;
    END IF;
  END LOOP;

  v_after := v_total - _cost;

  INSERT INTO public.credit_history(user_id, amount, type, service_id, description, balance_after)
  VALUES (_user_id, -_cost, 'deduct', _service_id, _service_id || ' xizmatidan foydalanish', v_after);

  INSERT INTO public.ai_usage(user_id, service_id, usage_date, channel, model, cost_credits, status)
  VALUES (_user_id, _service_id, (now())::date, _channel, _model, _cost, 'success')
  RETURNING id INTO v_usage_id;

  -- Proactive server-side low-balance notification (so user gets alerted right after AI usage, not only when opening Wallet)
  SELECT COALESCE(SUM(amount), 0) INTO v_recent_in
    FROM public.credit_history
    WHERE user_id = _user_id AND amount > 0 AND created_at >= now() - interval '90 days';

  IF v_after <= 0 THEN
    v_thr := 0;
    v_title := 'Med Coin tugadi';
    v_msg := 'Med Coin balansingiz 0 ga tushdi. AI xizmatlardan foydalanish uchun to‘ldiring.';
  ELSIF v_recent_in > 0 THEN
    v_pct := (v_after::numeric / v_recent_in::numeric) * 100.0;
    IF v_pct <= 10 THEN
      v_thr := 10;
      v_title := 'Med Coin juda kam qoldi (≤10%)';
      v_msg := format('Balansingizda atigi %s ta Med Coin qoldi. Xizmatlar uzilmasligi uchun to‘ldiring.', v_after);
    ELSIF v_pct <= 25 THEN
      v_thr := 25;
      v_title := 'Med Coin tugashiga yaqin (≤25%)';
      v_msg := format('Balansingizda %s ta Med Coin qoldi. AI xizmatlar uchun to‘ldirib qo‘ying.', v_after);
    ELSIF v_pct <= 50 THEN
      v_thr := 50;
      v_title := 'Med Coin balansingiz yarmi qoldi (≤50%)';
      v_msg := format('Balansingizda %s ta Med Coin qoldi.', v_after);
    END IF;
  END IF;

  IF v_thr IS NOT NULL THEN
    v_type := 'medcoin_alert_' || v_thr::text;
    IF NOT EXISTS (
      SELECT 1 FROM public.notifications
      WHERE user_id = _user_id AND type = v_type AND created_at >= now() - interval '24 hours'
    ) THEN
      INSERT INTO public.notifications(user_id, title, message, type, link)
      VALUES (_user_id, v_title, v_msg, v_type, '/dashboard?tab=wallet');
    END IF;
  END IF;

  RETURN QUERY SELECT true, v_after, NULL::text, v_usage_id;
END;
$function$;

-- Schedule periodic Med Coin expiration & warning check every 6 hours
DO $$
DECLARE
  v_jobid bigint;
BEGIN
  SELECT jobid INTO v_jobid FROM cron.job WHERE jobname = 'medcoin-expiry-check' LIMIT 1;
  IF v_jobid IS NOT NULL THEN
    PERFORM cron.unschedule(v_jobid);
  END IF;
  PERFORM cron.schedule(
    'medcoin-expiry-check',
    '0 */6 * * *',
    'SELECT public.expire_and_notify_med_coins(NULL);'
  );
END $$;

-- 3. Fix referral signup trigger column and add OAuth/Google post-signup referral claim RPC
CREATE OR REPLACE FUNCTION public.handle_new_user_referral()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_code_text TEXT;
  v_code public.referral_codes%ROWTYPE;
  v_email TEXT;
  v_source TEXT;
  v_existing UUID;
BEGIN
  v_code_text := UPPER(NULLIF(TRIM(NEW.raw_user_meta_data->>'referral_code'), ''));
  IF v_code_text IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT * INTO v_code FROM public.referral_codes
    WHERE code = v_code_text AND is_active = true
    LIMIT 1;

  IF NOT FOUND THEN
    RETURN NEW;
  END IF;

  IF v_code.owner_id = NEW.id THEN
    RETURN NEW;
  END IF;

  SELECT id INTO v_existing FROM public.referrals
    WHERE referred_user_id = NEW.id LIMIT 1;
  IF v_existing IS NOT NULL THEN
    RETURN NEW;
  END IF;

  v_email := NEW.email;
  v_source := NEW.raw_user_meta_data->>'referral_source';

  INSERT INTO public.referrals(
    code_id, code_text, referrer_id, referred_user_id, referred_email,
    referred_org_role, status, registered_at, meta
  ) VALUES (
    v_code.id, v_code.code, v_code.owner_id, NEW.id, v_email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'patient'),
    'registered', now(),
    jsonb_build_object(
      'source', v_source,
      'captured_at', NEW.raw_user_meta_data->>'referral_captured_at'
    )
  );

  UPDATE public.referral_codes
    SET total_uses = COALESCE(total_uses, 0) + 1,
        updated_at = now()
    WHERE id = v_code.id;

  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.claim_my_referral(_code text, _source text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_code_text text := UPPER(NULLIF(TRIM(_code), ''));
  v_code public.referral_codes%ROWTYPE;
  v_user record;
  v_existing uuid;
  v_role text;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'unauthorized');
  END IF;
  IF v_code_text IS NULL OR v_code_text !~ '^[A-Z0-9_-]{4,32}$' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_code');
  END IF;

  SELECT id INTO v_existing FROM public.referrals WHERE referred_user_id = v_uid LIMIT 1;
  IF v_existing IS NOT NULL THEN
    RETURN jsonb_build_object('ok', true, 'already', true);
  END IF;

  SELECT id, email, created_at, raw_user_meta_data INTO v_user FROM auth.users WHERE id = v_uid;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'user_not_found');
  END IF;

  -- Only allow attaching a referral to a freshly registered account (within 24 hours of signup)
  IF v_user.created_at < now() - interval '24 hours' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'account_too_old');
  END IF;

  SELECT * INTO v_code FROM public.referral_codes
    WHERE code = v_code_text AND is_active = true
    LIMIT 1;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'code_not_found');
  END IF;

  IF v_code.owner_id = v_uid THEN
    RETURN jsonb_build_object('ok', false, 'error', 'self_referral');
  END IF;

  SELECT role::text INTO v_role FROM public.user_roles WHERE user_id = v_uid LIMIT 1;

  INSERT INTO public.referrals(
    code_id, code_text, referrer_id, referred_user_id, referred_email,
    referred_org_role, status, registered_at, meta
  ) VALUES (
    v_code.id,
    v_code.code,
    v_code.owner_id,
    v_uid,
    v_user.email,
    COALESCE(v_role, v_user.raw_user_meta_data->>'role', 'patient'),
    'registered',
    now(),
    jsonb_build_object(
      'source', COALESCE(NULLIF(trim(_source), ''), 'oauth_claim'),
      'claimed_via', 'claim_my_referral'
    )
  );

  UPDATE public.referral_codes
    SET total_uses = COALESCE(total_uses, 0) + 1,
        updated_at = now()
    WHERE id = v_code.id;

  RETURN jsonb_build_object('ok', true, 'claimed', true, 'code', v_code.code);
END $function$;

GRANT EXECUTE ON FUNCTION public.claim_my_referral(text, text) TO authenticated, service_role;