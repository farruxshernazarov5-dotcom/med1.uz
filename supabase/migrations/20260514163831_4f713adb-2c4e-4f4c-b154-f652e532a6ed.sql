
-- Webhook fanout helper: insert a pending delivery for every active webhook subscribed to event
CREATE OR REPLACE FUNCTION public.enqueue_webhook_event(_event text, _payload jsonb)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer := 0;
BEGIN
  INSERT INTO public.api_webhook_deliveries (webhook_id, event, payload, status, next_retry_at)
  SELECT w.id, _event, _payload, 'pending', now()
  FROM public.api_webhooks w
  JOIN public.api_partners p ON p.id = w.partner_id
  WHERE w.is_active = true
    AND p.status = 'approved'
    AND _event = ANY(w.events);
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- Trigger: appointment.created
CREATE OR REPLACE FUNCTION public.trg_appointments_webhook_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.enqueue_webhook_event(
    'appointment.created',
    jsonb_build_object(
      'id', NEW.id,
      'clinic_id', NEW.clinic_id,
      'doctor_id', NEW.doctor_id,
      'service_id', NEW.service_id,
      'patient_name', NEW.patient_name,
      'patient_phone', NEW.patient_phone,
      'appointment_date', NEW.appointment_date,
      'appointment_time', NEW.appointment_time,
      'status', NEW.status,
      'total_price', NEW.total_price,
      'created_at', NEW.created_at
    )
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS appointments_webhook_created ON public.appointments;
CREATE TRIGGER appointments_webhook_created
  AFTER INSERT ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.trg_appointments_webhook_created();

-- Helpful index for dispatcher polling
CREATE INDEX IF NOT EXISTS idx_api_webhook_deliv_pending
  ON public.api_webhook_deliveries (next_retry_at)
  WHERE status IN ('pending','retrying');
