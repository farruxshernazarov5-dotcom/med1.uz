DROP POLICY IF EXISTS "Clinic owners manage hms_finance" ON public.hms_finance;
CREATE POLICY "Clinic owners manage hms_finance" ON public.hms_finance FOR ALL TO authenticated
  USING (public.clinic_owner_has_feature(clinic_id, 'billing'))
  WITH CHECK (public.clinic_owner_has_feature(clinic_id, 'billing'));
DROP POLICY IF EXISTS "Clinic owners manage hms_payroll" ON public.hms_payroll;
CREATE POLICY "Clinic owners manage hms_payroll" ON public.hms_payroll FOR ALL TO authenticated
  USING (public.clinic_owner_has_feature(clinic_id, 'staff'))
  WITH CHECK (public.clinic_owner_has_feature(clinic_id, 'staff'));