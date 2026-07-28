
-- Allow patients to flag messages in their own conversation (moderation only)
DROP POLICY IF EXISTS "Patients flag own chat messages" ON public.doctor_ext_chat_messages;
CREATE POLICY "Patients flag own chat messages"
  ON public.doctor_ext_chat_messages FOR UPDATE TO authenticated
  USING (patient_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (patient_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- Scheduled dispatcher for appointment reminders (every 5 minutes)
DO $$
DECLARE
  v_key text;
BEGIN
  BEGIN
    SELECT decrypted_secret INTO v_key FROM vault.decrypted_secrets
      WHERE name = 'email_queue_service_role_key' LIMIT 1;
  EXCEPTION WHEN OTHERS THEN
    v_key := NULL;
  END;

  IF v_key IS NULL THEN
    RAISE NOTICE 'service role key not found in vault; skipping cron scheduling';
    RETURN;
  END IF;

  PERFORM cron.unschedule('doctor-appointment-reminders')
    WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'doctor-appointment-reminders');

  PERFORM cron.schedule(
    'doctor-appointment-reminders',
    '*/5 * * * *',
    format($cron$
      SELECT net.http_post(
        url := 'https://wiqcfyecdmararxqdmfk.supabase.co/functions/v1/doctor-appointment-reminders',
        headers := jsonb_build_object('Content-Type','application/json','Authorization','Bearer %s'),
        body := '{}'::jsonb
      );
    $cron$, v_key)
  );
END $$;
