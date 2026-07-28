
-- 1. Chat moderation + attachment retention
ALTER TABLE public.doctor_ext_chat_messages
  ADD COLUMN IF NOT EXISTS is_flagged boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS flag_reason text,
  ADD COLUMN IF NOT EXISTS is_hidden boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS attachment_size integer,
  ADD COLUMN IF NOT EXISTS attachment_expires_at timestamptz;

CREATE OR REPLACE FUNCTION public.doctor_chat_moderate()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_reasons text[] := '{}';
BEGIN
  IF NEW.content IS NOT NULL THEN
    IF NEW.content ~* '(https?://|www\.|t\.me/|bit\.ly)' THEN
      v_reasons := array_append(v_reasons, 'tashqi_havola');
    END IF;
    IF NEW.content ~ '(\+998[0-9]{9}|[0-9]{16})' THEN
      v_reasons := array_append(v_reasons, 'shaxsiy_malumot');
    END IF;
    IF NEW.content ~* '(karta raqam|card number|parol|password|otp kod)' THEN
      v_reasons := array_append(v_reasons, 'maxfiy_malumot');
    END IF;
  END IF;

  IF NEW.attachment_name IS NOT NULL
     AND NEW.attachment_name ~* '\.(exe|bat|cmd|sh|js|apk|scr|msi|jar|dll|vbs)$' THEN
    v_reasons := array_append(v_reasons, 'xavfli_fayl');
    NEW.is_hidden := true;
  END IF;

  IF NEW.attachment_url IS NOT NULL AND NEW.attachment_expires_at IS NULL THEN
    NEW.attachment_expires_at := now() + interval '30 days';
  END IF;

  IF array_length(v_reasons, 1) > 0 THEN
    NEW.is_flagged := true;
    NEW.flag_reason := array_to_string(v_reasons, ',');
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_doctor_chat_moderate ON public.doctor_ext_chat_messages;
CREATE TRIGGER trg_doctor_chat_moderate
  BEFORE INSERT ON public.doctor_ext_chat_messages
  FOR EACH ROW EXECUTE FUNCTION public.doctor_chat_moderate();

-- 2. Cancel / reschedule support
ALTER TABLE public.doctor_ext_appointments
  ADD COLUMN IF NOT EXISTS cancelled_at timestamptz,
  ADD COLUMN IF NOT EXISTS cancelled_reason text,
  ADD COLUMN IF NOT EXISTS rescheduled_from uuid,
  ADD COLUMN IF NOT EXISTS reschedule_count integer NOT NULL DEFAULT 0;

-- 3. Doctor availability calendar
CREATE TABLE IF NOT EXISTS public.doctor_ext_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id uuid NOT NULL REFERENCES public.doctors_external(id) ON DELETE CASCADE,
  weekday smallint NOT NULL CHECK (weekday BETWEEN 0 AND 6),
  start_time time NOT NULL DEFAULT '09:00',
  end_time time NOT NULL DEFAULT '17:00',
  slot_minutes integer NOT NULL DEFAULT 30,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (doctor_id, weekday)
);

GRANT SELECT ON public.doctor_ext_availability TO anon, authenticated;
GRANT ALL ON public.doctor_ext_availability TO service_role;
ALTER TABLE public.doctor_ext_availability ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view doctor availability" ON public.doctor_ext_availability;
CREATE POLICY "Anyone can view doctor availability"
  ON public.doctor_ext_availability FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Admins manage doctor availability" ON public.doctor_ext_availability;
CREATE POLICY "Admins manage doctor availability"
  ON public.doctor_ext_availability FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP TRIGGER IF EXISTS trg_doctor_availability_updated ON public.doctor_ext_availability;
CREATE TRIGGER trg_doctor_availability_updated
  BEFORE UPDATE ON public.doctor_ext_availability
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE INDEX IF NOT EXISTS idx_doctor_availability_doctor ON public.doctor_ext_availability(doctor_id);

-- 4. Reminders
CREATE TABLE IF NOT EXISTS public.doctor_appointment_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid NOT NULL REFERENCES public.doctor_ext_appointments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  kind text NOT NULL DEFAULT 'reminder_1h',
  channel text NOT NULL DEFAULT 'email',
  scheduled_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz,
  status text NOT NULL DEFAULT 'pending',
  error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (appointment_id, kind, channel)
);

GRANT SELECT ON public.doctor_appointment_reminders TO authenticated;
GRANT ALL ON public.doctor_appointment_reminders TO service_role;
ALTER TABLE public.doctor_appointment_reminders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own appointment reminders" ON public.doctor_appointment_reminders;
CREATE POLICY "Users view own appointment reminders"
  ON public.doctor_appointment_reminders FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS idx_appt_reminders_due
  ON public.doctor_appointment_reminders(status, scheduled_at);

DROP TRIGGER IF EXISTS trg_appt_reminders_updated ON public.doctor_appointment_reminders;
CREATE TRIGGER trg_appt_reminders_updated
  BEFORE UPDATE ON public.doctor_appointment_reminders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- 5. Auto-enqueue reminders when appointment becomes confirmed
CREATE OR REPLACE FUNCTION public.enqueue_doctor_appointment_reminders()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_start timestamptz;
  v_ch text;
BEGIN
  IF NEW.status <> 'confirmed' OR (TG_OP = 'UPDATE' AND OLD.status = 'confirmed') THEN
    RETURN NEW;
  END IF;

  v_start := (NEW.appointment_date::text || ' ' || NEW.appointment_time::text)::timestamp
             AT TIME ZONE 'Asia/Tashkent';

  FOREACH v_ch IN ARRAY ARRAY['email','sms','telegram'] LOOP
    INSERT INTO public.doctor_appointment_reminders
      (appointment_id, user_id, kind, channel, scheduled_at)
    VALUES (NEW.id, NEW.patient_id, 'confirmation', v_ch, now())
    ON CONFLICT (appointment_id, kind, channel) DO NOTHING;

    INSERT INTO public.doctor_appointment_reminders
      (appointment_id, user_id, kind, channel, scheduled_at)
    VALUES (NEW.id, NEW.patient_id, 'reminder_1h', v_ch, v_start - interval '1 hour')
    ON CONFLICT (appointment_id, kind, channel) DO NOTHING;
  END LOOP;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enqueue_doctor_appt_reminders ON public.doctor_ext_appointments;
CREATE TRIGGER trg_enqueue_doctor_appt_reminders
  AFTER INSERT OR UPDATE OF status ON public.doctor_ext_appointments
  FOR EACH ROW EXECUTE FUNCTION public.enqueue_doctor_appointment_reminders();

-- 6. Cancel reminders when appointment is cancelled/rescheduled
CREATE OR REPLACE FUNCTION public.cancel_doctor_appointment_reminders()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'cancelled' AND OLD.status <> 'cancelled' THEN
    UPDATE public.doctor_appointment_reminders
      SET status = 'cancelled', updated_at = now()
      WHERE appointment_id = NEW.id AND status = 'pending';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_cancel_doctor_appt_reminders ON public.doctor_ext_appointments;
CREATE TRIGGER trg_cancel_doctor_appt_reminders
  AFTER UPDATE OF status ON public.doctor_ext_appointments
  FOR EACH ROW EXECUTE FUNCTION public.cancel_doctor_appointment_reminders();

-- 7. Reschedule RPC (atomic slot move)
CREATE OR REPLACE FUNCTION public.reschedule_doctor_ext_slot(
  _appointment_id uuid, _new_date date, _new_time time, _reason text DEFAULT NULL
)
RETURNS public.doctor_ext_appointments
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_old public.doctor_ext_appointments;
  v_new public.doctor_ext_appointments;
BEGIN
  SELECT * INTO v_old FROM public.doctor_ext_appointments WHERE id = _appointment_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'appointment_not_found'; END IF;
  IF v_old.patient_id <> auth.uid() AND NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  IF v_old.status = 'cancelled' THEN RAISE EXCEPTION 'appointment_cancelled'; END IF;
  IF v_old.reschedule_count >= 3 THEN RAISE EXCEPTION 'reschedule_limit_reached'; END IF;

  IF EXISTS (
    SELECT 1 FROM public.doctor_ext_appointments
    WHERE doctor_id = v_old.doctor_id AND appointment_date = _new_date
      AND appointment_time = _new_time AND status <> 'cancelled' AND id <> _appointment_id
  ) THEN
    RAISE EXCEPTION 'slot_taken';
  END IF;

  UPDATE public.doctor_ext_appointments SET
    appointment_date = _new_date,
    appointment_time = _new_time,
    reschedule_count = reschedule_count + 1,
    rescheduled_from = _appointment_id,
    notes = COALESCE(notes, '') || CASE WHEN _reason IS NULL THEN '' ELSE E'\n[Qayta bron] ' || _reason END,
    updated_at = now()
  WHERE id = _appointment_id
  RETURNING * INTO v_new;

  UPDATE public.doctor_appointment_reminders
    SET status = 'cancelled', updated_at = now()
    WHERE appointment_id = _appointment_id AND status = 'pending';

  IF v_new.status = 'confirmed' THEN
    INSERT INTO public.doctor_appointment_reminders (appointment_id, user_id, kind, channel, scheduled_at)
    SELECT _appointment_id, v_new.patient_id, 'reminder_1h', ch,
           ((_new_date::text || ' ' || _new_time::text)::timestamp AT TIME ZONE 'Asia/Tashkent') - interval '1 hour'
    FROM unnest(ARRAY['email','sms','telegram']) ch
    ON CONFLICT (appointment_id, kind, channel)
    DO UPDATE SET status = 'pending', scheduled_at = EXCLUDED.scheduled_at, sent_at = NULL, updated_at = now();
  END IF;

  RETURN v_new;
END;
$$;

REVOKE ALL ON FUNCTION public.reschedule_doctor_ext_slot(uuid, date, time, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.reschedule_doctor_ext_slot(uuid, date, time, text) TO authenticated;

-- 8. Cancel RPC
CREATE OR REPLACE FUNCTION public.cancel_doctor_ext_appointment(_appointment_id uuid, _reason text DEFAULT NULL)
RETURNS public.doctor_ext_appointments
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_row public.doctor_ext_appointments;
BEGIN
  SELECT * INTO v_row FROM public.doctor_ext_appointments WHERE id = _appointment_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'appointment_not_found'; END IF;
  IF v_row.patient_id <> auth.uid() AND NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  UPDATE public.doctor_ext_appointments SET
    status = 'cancelled',
    cancelled_at = now(),
    cancelled_reason = COALESCE(_reason, 'Bemor tomonidan bekor qilindi'),
    updated_at = now()
  WHERE id = _appointment_id
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

REVOKE ALL ON FUNCTION public.cancel_doctor_ext_appointment(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.cancel_doctor_ext_appointment(uuid, text) TO authenticated;
