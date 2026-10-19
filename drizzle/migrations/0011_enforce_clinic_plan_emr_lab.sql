CREATE OR REPLACE FUNCTION public.clinic_owner_has_feature(_clinic_id uuid, _feature text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.registered_clinics c
    WHERE c.id = _clinic_id AND c.owner_id = auth.uid()
      AND (
        EXISTS (
          SELECT 1 FROM public.tenant_subscriptions s
          JOIN public.saas_plans p ON p.id = s.plan_id
          WHERE s.owner_id = c.owner_id AND s.module_id = 'clinic'
            AND COALESCE(s.status, 'active') IN ('active', 'trialing')
            AND (s.expires_at IS NULL OR s.expires_at > now())
            AND p.features ? _feature
        )
        OR (
          NOT EXISTS (SELECT 1 FROM public.tenant_subscriptions s2 WHERE s2.owner_id = c.owner_id AND s2.module_id = 'clinic' AND s2.plan_id IS NOT NULL)
          AND EXISTS (SELECT 1 FROM public.saas_plans fp WHERE fp.module_id = 'clinic' AND fp.tier = 'free' AND fp.features ? _feature)
        )
      )
  );
$$;
REVOKE EXECUTE ON FUNCTION public.clinic_owner_has_feature(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.clinic_owner_has_feature(uuid, text) TO authenticated, service_role;

DROP POLICY IF EXISTS "Clinic owners manage hms_medical_records" ON public.hms_medical_records;
CREATE POLICY "Clinic owners manage hms_medical_records" ON public.hms_medical_records FOR ALL TO authenticated
  USING (public.clinic_owner_has_feature(clinic_id, 'emr'))
  WITH CHECK (public.clinic_owner_has_feature(clinic_id, 'emr'));

DROP POLICY IF EXISTS "Clinic owners manage hms_lab_orders" ON public.hms_lab_orders;
CREATE POLICY "Clinic owners manage hms_lab_orders" ON public.hms_lab_orders FOR ALL TO authenticated
  USING (public.clinic_owner_has_feature(clinic_id, 'lab'))
  WITH CHECK (public.clinic_owner_has_feature(clinic_id, 'lab'));

DROP POLICY IF EXISTS "Clinic owners manage hms_lab_results" ON public.hms_lab_results;
CREATE POLICY "Clinic owners manage hms_lab_results" ON public.hms_lab_results FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.hms_lab_orders o WHERE o.id = hms_lab_results.order_id AND public.clinic_owner_has_feature(o.clinic_id, 'lab')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.hms_lab_orders o WHERE o.id = hms_lab_results.order_id AND public.clinic_owner_has_feature(o.clinic_id, 'lab')));