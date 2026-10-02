DROP POLICY IF EXISTS "Anyone can insert telegram_otp" ON public.telegram_otp;
DROP POLICY IF EXISTS "System inserts analytics" ON public.marketing_analytics;
DROP POLICY IF EXISTS "Anyone can record a visit" ON public.partner_visits;

DROP POLICY IF EXISTS "authenticated insert debug log" ON public.security_debug_log;
CREATE POLICY "authenticated insert own debug log" ON public.security_debug_log
  FOR INSERT TO authenticated WITH CHECK (user_id IS NULL OR user_id = auth.uid());

DROP POLICY IF EXISTS "Authenticated users can insert audit logs" ON public.doctor_audit_logs;
CREATE POLICY "Users insert own audit logs" ON public.doctor_audit_logs
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Anyone tracks views" ON public.doctor_profile_views;
CREATE POLICY "Anyone tracks views of existing doctors" ON public.doctor_profile_views
  FOR INSERT TO anon, authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.doctors d WHERE d.id = doctor_id)
              AND (source IS NULL OR length(source) <= 50)
              AND (visitor_hash IS NULL OR length(visitor_hash) <= 128));

DROP POLICY IF EXISTS "Anyone creates leads" ON public.doctor_leads;
CREATE POLICY "Anyone creates valid leads" ON public.doctor_leads
  FOR INSERT TO anon, authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.doctors d WHERE d.id = doctor_id)
              AND status = 'new' AND reply IS NULL
              AND length(full_name) BETWEEN 1 AND 200
              AND length(phone) BETWEEN 5 AND 32
              AND (message IS NULL OR length(message) <= 2000)
              AND (source IS NULL OR length(source) <= 50));

DROP POLICY IF EXISTS "Authenticated users can upload clinic photos" ON storage.objects;
CREATE POLICY "Authenticated users can upload own clinic photos" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'clinic-photos' AND owner_id = (select auth.uid()::text));