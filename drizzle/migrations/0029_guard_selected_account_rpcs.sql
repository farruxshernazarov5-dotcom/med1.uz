DO $migration$
DECLARE v_name text; v_arg text; v_def text;
BEGIN
  FOREACH v_name IN ARRAY ARRAY['get_referral_stats','get_user_ai_access','apply_referral_reward'] LOOP
    v_arg := CASE WHEN v_name='get_user_ai_access' THEN '_user_id' ELSE '_owner_id' END;
    SELECT pg_get_functiondef(p.oid) INTO v_def FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.proname=v_name;
    IF v_name='apply_referral_reward' THEN
      v_def := replace(v_def, E'BEGIN\n', E'BEGIN\n  IF COALESCE(auth.role(), '''') <> ''service_role'' AND pg_trigger_depth() = 0 AND NOT COALESCE(public.has_role(auth.uid(), ''admin''), false) THEN RAISE EXCEPTION ''Forbidden'' USING ERRCODE = ''42501''; END IF;\n');
    ELSE
      v_def := replace(v_def, E'BEGIN\n', 'BEGIN' || E'\n' || '  IF COALESCE(auth.role(), '''') <> ''service_role'' AND (auth.uid() IS NULL OR (' || v_arg || ' IS DISTINCT FROM auth.uid() AND NOT COALESCE(public.has_role(auth.uid(), ''admin''), false))) THEN RAISE EXCEPTION ''Forbidden'' USING ERRCODE = ''42501''; END IF;' || E'\n');
    END IF;
    EXECUTE v_def;
  END LOOP;
END;
$migration$;
CREATE OR REPLACE FUNCTION public.get_saas_access(_owner_id uuid, _module text)
RETURNS TABLE(tier text, status text, expires_at timestamptz, features jsonb, limits jsonb)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $function$
BEGIN
  IF COALESCE(auth.role(), '') <> 'service_role' AND (auth.uid() IS NULL OR (_owner_id IS DISTINCT FROM auth.uid() AND NOT COALESCE(public.has_role(auth.uid(),'admin'),false))) THEN RAISE EXCEPTION 'Forbidden' USING ERRCODE='42501'; END IF;
  RETURN QUERY SELECT COALESCE(s.tier,'free'), COALESCE(s.status,'active'), s.expires_at, COALESCE(p.features,'[]'::jsonb), COALESCE(p.limits,'{}'::jsonb)
  FROM (SELECT 1) x LEFT JOIN public.tenant_subscriptions s ON s.owner_id=_owner_id AND s.module_id=_module LEFT JOIN public.saas_plans p ON p.id=s.plan_id LIMIT 1;
END;
$function$;
REVOKE EXECUTE ON FUNCTION public.ensure_referral_wallet(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.ensure_referral_wallet(uuid) TO service_role;
REVOKE EXECUTE ON FUNCTION public.enqueue_webhook_event(text,jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.enqueue_webhook_event(text,jsonb) TO service_role;
ALTER POLICY org_att_rec_staff_read ON public.org_attendance_records USING (EXISTS (SELECT 1 FROM public.org_attendance_staff s WHERE s.id=org_attendance_records.staff_id AND s.user_id=auth.uid() AND s.is_active=true));
ALTER POLICY org_att_set_staff_read ON public.org_attendance_settings USING (EXISTS (SELECT 1 FROM public.org_attendance_staff s WHERE s.owner_id=org_attendance_settings.owner_id AND s.user_id=auth.uid() AND s.is_active=true));