CREATE TABLE public.document_access_passwords (
 kind text NOT NULL CHECK(kind IN ('contract','document','vital')), code text NOT NULL,
 password_hash text NOT NULL, failed_attempts integer NOT NULL DEFAULT 0, blocked_until timestamptz,
 PRIMARY KEY(kind,code)
);
GRANT ALL ON public.document_access_passwords TO service_role;
ALTER TABLE public.document_access_passwords ENABLE ROW LEVEL SECURITY;
CREATE OR REPLACE FUNCTION public.owns_private_document(_kind text,_code text) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
SELECT auth.uid() IS NOT NULL AND (public.has_role(auth.uid(),'admin'::public.app_role) OR
 CASE _kind WHEN 'contract' THEN EXISTS(SELECT 1 FROM public.contracts WHERE lower(hash_id)=lower(trim(_code)) AND (owner_id=auth.uid() OR counterparty_id=auth.uid()))
 WHEN 'vital' THEN EXISTS(SELECT 1 FROM public.vital_reports WHERE code=upper(trim(_code)) AND user_id=auth.uid())
 WHEN 'document' THEN EXISTS(SELECT 1 FROM public.document_verifications d JOIN public.registered_clinics c ON c.id=d.clinic_id WHERE lower(d.verification_code)=lower(trim(_code)) AND c.owner_id=auth.uid()) ELSE false END)
$$;
REVOKE ALL ON FUNCTION public.owns_private_document(text,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.owns_private_document(text,text) TO authenticated,service_role;
CREATE OR REPLACE FUNCTION public.private_document_access(_kind text,_code text,_password text DEFAULT NULL,_action text DEFAULT 'verify') RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,extensions AS $$
DECLARE k text:=lower(trim(_kind)); c text:=lower(trim(_code)); r public.document_access_passwords%ROWTYPE; payload jsonb; own boolean; found_doc boolean;
BEGIN
 IF k NOT IN ('contract','document','vital') OR length(c)<6 OR length(c)>200 THEN RETURN jsonb_build_object('error','Kod noto‘g‘ri'); END IF;
 own:=public.owns_private_document(k,c);
 IF _action='set' THEN
  IF NOT own THEN RETURN jsonb_build_object('error','Hujjat egasi sifatida tizimga kiring'); END IF;
  IF _password IS NULL OR length(_password)<8 OR length(_password)>72 THEN RETURN jsonb_build_object('error','Parol 8–72 belgidan iborat bo‘lsin'); END IF;
  found_doc:=CASE k WHEN 'contract' THEN EXISTS(SELECT 1 FROM public.contracts WHERE lower(hash_id)=c) WHEN 'vital' THEN EXISTS(SELECT 1 FROM public.vital_reports WHERE lower(code)=c) ELSE EXISTS(SELECT 1 FROM public.document_verifications WHERE lower(verification_code)=c) END;
  IF NOT found_doc THEN RETURN jsonb_build_object('error','Hujjat topilmadi'); END IF;
  INSERT INTO public.document_access_passwords(kind,code,password_hash) VALUES(k,c,extensions.crypt(_password,extensions.gen_salt('bf',10))) ON CONFLICT(kind,code) DO UPDATE SET password_hash=EXCLUDED.password_hash,failed_attempts=0,blocked_until=NULL;
  RETURN jsonb_build_object('configured',true);
 END IF;
 IF _action NOT IN ('verify','status') THEN RETURN jsonb_build_object('error','Amal noto‘g‘ri'); END IF;
 SELECT * INTO r FROM public.document_access_passwords WHERE kind=k AND code=c FOR UPDATE;
 IF NOT FOUND THEN RETURN jsonb_build_object('locked',true,'can_configure',own,'error','Hujjat egasi tekshiruv parolini o‘rnatishi kerak'); END IF;
 IF _action='status' THEN RETURN jsonb_build_object('locked',true,'can_configure',own,'configured',true); END IF;
 IF r.blocked_until>now() THEN RETURN jsonb_build_object('locked',true,'error','Ko‘p noto‘g‘ri urinish. 10 daqiqadan keyin qayta urinib ko‘ring'); END IF;
 IF _password IS NULL OR length(_password)<8 OR length(_password)>72 THEN RETURN jsonb_build_object('locked',true,'error','Tekshiruv parolini kiriting'); END IF;
 IF extensions.crypt(_password,r.password_hash)<>r.password_hash THEN
  UPDATE public.document_access_passwords SET failed_attempts=CASE WHEN blocked_until IS NOT NULL AND blocked_until<=now() THEN 1 ELSE failed_attempts+1 END,blocked_until=CASE WHEN (CASE WHEN blocked_until IS NOT NULL AND blocked_until<=now() THEN 1 ELSE failed_attempts+1 END)>=5 THEN now()+interval '10 minutes' ELSE NULL END WHERE kind=k AND code=c;
  RETURN jsonb_build_object('locked',true,'error','Parol noto‘g‘ri');
 END IF;
 UPDATE public.document_access_passwords SET failed_attempts=0,blocked_until=NULL WHERE kind=k AND code=c;
 CASE k WHEN 'contract' THEN SELECT jsonb_build_object('contract',(SELECT to_jsonb(x) FROM public.verify_contract_by_hash(c) x LIMIT 1),'signatures',COALESCE((SELECT jsonb_agg(x) FROM public.verify_contract_signatures(c) x),'[]'::jsonb)) INTO payload;
 WHEN 'vital' THEN SELECT to_jsonb(x) INTO payload FROM public.verify_vital_report(c) x LIMIT 1;
 ELSE SELECT to_jsonb(x) INTO payload FROM public.verify_document_by_code((SELECT verification_code FROM public.document_verifications WHERE lower(verification_code)=c LIMIT 1)) x LIMIT 1;
 END CASE;
 RETURN jsonb_build_object('unlocked',true,'data',payload);
END $$;
REVOKE ALL ON FUNCTION public.private_document_access(text,text,text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.private_document_access(text,text,text,text) TO anon,authenticated,service_role;
REVOKE EXECUTE ON FUNCTION public.verify_contract_by_hash(text),public.verify_contract_signatures(text),public.verify_document_by_code(text),public.verify_vital_report(text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.verify_contract_by_hash(text),public.verify_contract_signatures(text),public.verify_document_by_code(text),public.verify_vital_report(text) TO service_role;