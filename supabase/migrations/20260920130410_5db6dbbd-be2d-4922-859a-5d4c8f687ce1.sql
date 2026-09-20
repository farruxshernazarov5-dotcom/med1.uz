GRANT SELECT, INSERT, UPDATE ON public.contracts TO authenticated;
GRANT ALL ON public.contracts TO service_role;
GRANT DELETE ON public.contracts TO authenticated;

GRANT SELECT ON public.contract_templates TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.contract_templates TO authenticated;
GRANT ALL ON public.contract_templates TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.contract_template_versions TO authenticated;
GRANT ALL ON public.contract_template_versions TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.contract_categories TO authenticated;
GRANT ALL ON public.contract_categories TO service_role;

GRANT SELECT, INSERT, UPDATE ON public.contract_signatures TO authenticated;
GRANT ALL ON public.contract_signatures TO service_role;

GRANT SELECT, INSERT, UPDATE ON public.contract_signature_otps TO authenticated;
GRANT ALL ON public.contract_signature_otps TO service_role;

GRANT ALL ON public.contract_signature_challenges TO service_role;

GRANT SELECT, INSERT, UPDATE ON public.contract_notifications TO authenticated;
GRANT ALL ON public.contract_notifications TO service_role;

GRANT SELECT, INSERT ON public.contract_access_log TO authenticated;
GRANT ALL ON public.contract_access_log TO service_role;