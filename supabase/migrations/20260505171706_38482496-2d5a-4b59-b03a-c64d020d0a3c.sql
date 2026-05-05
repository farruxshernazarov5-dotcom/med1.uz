-- 1) Remove public read access from private medical storage buckets.
DROP POLICY IF EXISTS "Anyone can view cosmetology files" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view maternity files" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view medtech files" ON storage.objects;

-- Ensure owner-scoped private read policies exist and are restricted to signed-in users.
DROP POLICY IF EXISTS "Cos files owner read" ON storage.objects;
CREATE POLICY "Cos files owner read"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'cosmetology-files'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Mat files owner read" ON storage.objects;
CREATE POLICY "Mat files owner read"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'maternity-files'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "MedTech files owner read" ON storage.objects;
CREATE POLICY "MedTech files owner read"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'medtech-files'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 2) Replace blanket realtime access with topic-scoped access.
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can use realtime" ON realtime.messages;
CREATE POLICY "Users can subscribe to their own realtime topics"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  realtime.topic() = ('user:' || auth.uid()::text)
  OR realtime.topic() LIKE ('user:' || auth.uid()::text || ':%')
);

-- 3) Prevent anonymous diagnostics booking from linking arbitrary patient UUIDs.
ALTER TABLE public.diagnostics_appointments
  ALTER COLUMN patient_id DROP NOT NULL;

DROP POLICY IF EXISTS "Public can create online booking" ON public.diagnostics_appointments;
CREATE POLICY "Public can create online booking"
ON public.diagnostics_appointments
FOR INSERT
TO anon, authenticated
WITH CHECK (
  appt_source = 'online'
  AND (
    (auth.uid() IS NULL AND patient_id IS NULL)
    OR (auth.uid() IS NOT NULL AND (patient_id IS NULL OR patient_id = auth.uid()))
  )
);

DROP POLICY IF EXISTS "Patients can create diag appointments" ON public.diagnostics_appointments;
CREATE POLICY "Patients can create diag appointments"
ON public.diagnostics_appointments
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = patient_id);

-- 4) Lock down SECURITY DEFINER helpers so anonymous users cannot execute them directly.
REVOKE EXECUTE ON FUNCTION public.cosmetology_handle_product_sale() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.cosmetology_handle_product_usage() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_appointment_to_doctor_patients() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_doctor_patient_counters() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_plan_paid_amount() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_transaction_from_split_payment() FROM PUBLIC, anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.get_saas_access(uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_saas_access(uuid, text) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.get_user_ai_access(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_ai_access(uuid) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.increment_knowledge_view(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_knowledge_view(uuid) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) TO service_role;

REVOKE EXECUTE ON FUNCTION public.delete_email(text, bigint) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.delete_email(text, bigint) TO service_role;

REVOKE EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) TO service_role;

REVOKE EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) TO service_role;