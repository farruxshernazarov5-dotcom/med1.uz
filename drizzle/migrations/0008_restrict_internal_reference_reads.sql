DROP POLICY IF EXISTS "Insurance companies readable by authenticated" ON public.insurance_companies;
CREATE POLICY "Admins read insurance companies" ON public.insurance_companies FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "auth read settings" ON public.referral_settings;
CREATE POLICY "Admins read referral settings" ON public.referral_settings FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Authenticated read versions" ON public.contract_template_versions;
CREATE POLICY "Admins read template versions" ON public.contract_template_versions FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));