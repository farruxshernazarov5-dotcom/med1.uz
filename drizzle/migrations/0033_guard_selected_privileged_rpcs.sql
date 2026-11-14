DROP POLICY IF EXISTS "Patients can update pending appointments" ON public.appointments;
CREATE POLICY "Patients can update pending appointments" ON public.appointments
  FOR UPDATE TO authenticated
  USING (auth.uid() = patient_id AND status = 'pending')
  WITH CHECK (auth.uid() = patient_id AND status IN ('pending','cancelled'));

DO $mig$
DECLARE
  f text;
  d text;
  guard text;
BEGIN
  FOREACH f IN ARRAY ARRAY['public.release_held_referral_rewards()','public.revoke_referral_reward(uuid,text)'] LOOP
    d := pg_get_functiondef(f::regprocedure);
    guard := E'\nBEGIN\n  IF auth.uid() IS NOT NULL AND NOT public.has_role(auth.uid(), ''admin''::app_role) THEN\n    RAISE EXCEPTION ''forbidden'' USING ERRCODE = ''42501'';\n  END IF;\n';
    d := regexp_replace(d, E'\nBEGIN\n', guard);
    EXECUTE d;
  END LOOP;

  d := pg_get_functiondef('public.click_refund_payment(uuid,text,uuid)'::regprocedure);
  d := regexp_replace(d, E'\nBEGIN\n', E'\nBEGIN\n  IF auth.uid() IS NOT NULL AND _admin IS DISTINCT FROM auth.uid() THEN\n    RETURN jsonb_build_object(''ok'', false, ''error'', ''forbidden'');\n  END IF;\n');
  EXECUTE d;
END
$mig$;

REVOKE EXECUTE ON FUNCTION public.release_held_referral_rewards() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.revoke_referral_reward(uuid,text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.click_refund_payment(uuid,text,uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.purge_security_logs(integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.purge_security_logs(integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.release_held_referral_rewards() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.revoke_referral_reward(uuid,text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.click_refund_payment(uuid,text,uuid) TO authenticated, service_role;