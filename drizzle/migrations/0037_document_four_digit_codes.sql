CREATE TABLE public.document_pin_secret (id boolean PRIMARY KEY DEFAULT true CHECK (id), secret text NOT NULL DEFAULT encode(extensions.gen_random_bytes(32),'hex'));
GRANT ALL ON public.document_pin_secret TO service_role;
ALTER TABLE public.document_pin_secret ENABLE ROW LEVEL SECURITY;
INSERT INTO public.document_pin_secret(id) VALUES (true) ON CONFLICT DO NOTHING;

CREATE OR REPLACE FUNCTION public.document_pin_value(_kind text,_code text) RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,extensions AS $$
SELECT lpad(((('x'||substr(encode(extensions.hmac(lower(trim(_kind))||':'||lower(trim(_code)),(SELECT secret FROM public.document_pin_secret LIMIT 1),'sha256'),'hex'),1,8))::bit(32)::bigint % 10000))::text,4,'0')
$$;
REVOKE ALL ON FUNCTION public.document_pin_value(text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.document_pin_value(text,text) TO service_role;

CREATE OR REPLACE FUNCTION public.get_document_pin(_kind text,_code text) RETURNS text LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF NOT public.owns_private_document(lower(trim(_kind)),lower(trim(_code))) THEN RETURN NULL; END IF;
 RETURN public.document_pin_value(_kind,_code);
END $$;
REVOKE ALL ON FUNCTION public.get_document_pin(text,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.get_document_pin(text,text) TO authenticated,service_role;

CREATE OR REPLACE FUNCTION public.private_document_access(_kind text,_code text,_password text DEFAULT NULL,_action text DEFAULT 'verify') RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,extensions AS $$
DECLARE k text:=lower(trim(_kind)); c text:=lower(trim(_code)); r public.document_access_passwords%ROWTYPE; payload jsonb; own boolean; found_doc boolean; pin text; ok boolean;
BEGIN
 IF k NOT IN ('contract','document','vital') OR length(c)<6 OR length(c)>200 THEN RETURN jsonb_build_object('error','Kod noto‘g‘ri'); END IF;
 own:=public.owns_private_document(k,c);
 found_doc:=CASE k WHEN 'contract' THEN EXISTS(SELECT 1 FROM public.contracts WHERE lower(hash_id)=c) WHEN 'vital' THEN EXISTS(SELECT 1 FROM public.vital_reports WHERE lower(code)=c) ELSE EXISTS(SELECT 1 FROM public.document_verifications WHERE lower(verification_code)=c) END;
 IF NOT found_doc THEN RETURN jsonb_build_object('error','Hujjat topilmadi'); END IF;
 pin:=public.document_pin_value(k,c);
 IF _action='status' THEN RETURN jsonb_build_object('locked',true,'configured',true,'can_configure',own); END IF;
 IF _action<>'verify' THEN RETURN jsonb_build_object('error','Amal noto‘g‘ri'); END IF;
 INSERT INTO public.document_access_passwords(kind,code,password_hash) VALUES(k,c,extensions.crypt(pin,extensions.gen_salt('bf',8))) ON CONFLICT DO NOTHING;
 SELECT * INTO r FROM public.document_access_passwords WHERE kind=k AND code=c FOR UPDATE;
 IF r.blocked_until>now() THEN RETURN jsonb_build_object('locked',true,'error','Ko‘p noto‘g‘ri urinish. 10 daqiqadan keyin qayta urinib ko‘ring'); END IF;
 IF _password IS NULL OR length(_password)<4 OR length(_password)>72 THEN RETURN jsonb_build_object('locked',true,'error','Hujjatdagi 4 xonali kodni kiriting'); END IF;
 ok:= trim(_password)=pin OR extensions.crypt(_password,r.password_hash)=r.password_hash;
 IF NOT ok THEN
  UPDATE public.document_access_passwords SET failed_attempts=CASE WHEN blocked_until IS NOT NULL AND blocked_until<=now() THEN 1 ELSE failed_attempts+1 END,blocked_until=CASE WHEN (CASE WHEN blocked_until IS NOT NULL AND blocked_until<=now() THEN 1 ELSE failed_attempts+1 END)>=5 THEN now()+interval '10 minutes' ELSE NULL END WHERE kind=k AND code=c;
  RETURN jsonb_build_object('locked',true,'error','Kod noto‘g‘ri');
 END IF;
 UPDATE public.document_access_passwords SET failed_attempts=0,blocked_until=NULL WHERE kind=k AND code=c;
 CASE k WHEN 'contract' THEN SELECT jsonb_build_object('contract',(SELECT to_jsonb(x) FROM public.verify_contract_by_hash(c) x LIMIT 1),'signatures',COALESCE((SELECT jsonb_agg(x) FROM public.verify_contract_signatures(c) x),'[]'::jsonb)) INTO payload;
 WHEN 'vital' THEN SELECT to_jsonb(x) INTO payload FROM public.verify_vital_report(upper(c)) x LIMIT 1;
 ELSE SELECT to_jsonb(x) INTO payload FROM public.verify_document_by_code((SELECT verification_code FROM public.document_verifications WHERE lower(verification_code)=c LIMIT 1)) x LIMIT 1;
 END CASE;
 RETURN jsonb_build_object('unlocked',true,'data',payload);
END $$;
REVOKE ALL ON FUNCTION public.private_document_access(text,text,text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.private_document_access(text,text,text,text) TO anon,authenticated,service_role;