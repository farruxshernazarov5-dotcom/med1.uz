-- 1. Prevent double booking
CREATE UNIQUE INDEX IF NOT EXISTS doctor_ext_appointments_slot_uniq
  ON public.doctor_ext_appointments (doctor_id, appointment_date, appointment_time)
  WHERE status <> 'cancelled';

ALTER TABLE public.doctor_ext_appointments
  ADD COLUMN IF NOT EXISTS payment_id uuid,
  ADD COLUMN IF NOT EXISTS paid_at timestamptz;

-- 2. Atomic booking RPC
CREATE OR REPLACE FUNCTION public.book_doctor_ext_slot(
  _doctor_id uuid,
  _service_id uuid,
  _service_name text,
  _appointment_date date,
  _appointment_time time,
  _duration_minutes integer,
  _patient_name text,
  _patient_phone text,
  _notes text,
  _price numeric,
  _payment_method text
) RETURNS public.doctor_ext_appointments
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _row public.doctor_ext_appointments;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'auth_required';
  END IF;
  IF _appointment_date < (now() AT TIME ZONE 'Asia/Tashkent')::date THEN
    RAISE EXCEPTION 'past_date';
  END IF;

  BEGIN
    INSERT INTO public.doctor_ext_appointments (
      doctor_id, patient_id, service_id, service_name, appointment_date, appointment_time,
      duration_minutes, patient_name, patient_phone, notes, price, payment_method,
      payment_status, status
    ) VALUES (
      _doctor_id, _uid, _service_id, _service_name, _appointment_date, _appointment_time,
      COALESCE(_duration_minutes, 30), _patient_name, _patient_phone, NULLIF(_notes, ''),
      COALESCE(_price, 0), COALESCE(_payment_method, 'cash'),
      CASE WHEN COALESCE(_payment_method,'cash') = 'cash' THEN 'pending' ELSE 'awaiting_payment' END,
      'pending'
    )
    RETURNING * INTO _row;
  EXCEPTION WHEN unique_violation THEN
    RAISE EXCEPTION 'slot_taken';
  END;

  RETURN _row;
END;
$$;

REVOKE ALL ON FUNCTION public.book_doctor_ext_slot(uuid,uuid,text,date,time,integer,text,text,text,numeric,text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.book_doctor_ext_slot(uuid,uuid,text,date,time,integer,text,text,text,numeric,text) FROM anon;
GRANT EXECUTE ON FUNCTION public.book_doctor_ext_slot(uuid,uuid,text,date,time,integer,text,text,text,numeric,text) TO authenticated;

-- 3. Payment -> booking status sync
CREATE OR REPLACE FUNCTION public.sync_doctor_appointment_payment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.purpose = 'doctor_appointment' AND NEW.reference_id IS NOT NULL
     AND NEW.status IS DISTINCT FROM OLD.status THEN
    IF NEW.status = 'paid' THEN
      UPDATE public.doctor_ext_appointments
        SET payment_status = 'paid', status = 'confirmed',
            paid_at = COALESCE(NEW.paid_at, now()), payment_id = NEW.id, updated_at = now()
      WHERE id = NEW.reference_id::uuid;
    ELSIF NEW.status IN ('cancelled', 'failed', 'expired') THEN
      UPDATE public.doctor_ext_appointments
        SET payment_status = 'failed', status = 'cancelled', updated_at = now()
      WHERE id = NEW.reference_id::uuid AND payment_status <> 'paid';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_doctor_appointment_payment ON public.platform_payments;
CREATE TRIGGER trg_sync_doctor_appointment_payment
AFTER UPDATE ON public.platform_payments
FOR EACH ROW EXECUTE FUNCTION public.sync_doctor_appointment_payment();

-- 4. Video rooms
CREATE TABLE IF NOT EXISTS public.doctor_video_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid REFERENCES public.doctor_ext_appointments(id) ON DELETE CASCADE,
  doctor_id uuid NOT NULL,
  patient_id uuid NOT NULL,
  room_code text NOT NULL UNIQUE DEFAULT ('med1-' || encode(gen_random_bytes(6), 'hex')),
  provider text NOT NULL DEFAULT 'jitsi',
  status text NOT NULL DEFAULT 'waiting',
  scheduled_at timestamptz,
  started_at timestamptz,
  ended_at timestamptz,
  duration_seconds integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.doctor_video_rooms TO authenticated;
GRANT ALL ON public.doctor_video_rooms TO service_role;
ALTER TABLE public.doctor_video_rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patients view own video rooms" ON public.doctor_video_rooms
  FOR SELECT TO authenticated USING (patient_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Patients create own video rooms" ON public.doctor_video_rooms
  FOR INSERT TO authenticated WITH CHECK (patient_id = auth.uid());
CREATE POLICY "Patients update own video rooms" ON public.doctor_video_rooms
  FOR UPDATE TO authenticated USING (patient_id = auth.uid()) WITH CHECK (patient_id = auth.uid());

DROP TRIGGER IF EXISTS trg_doctor_video_rooms_updated ON public.doctor_video_rooms;
CREATE TRIGGER trg_doctor_video_rooms_updated
BEFORE UPDATE ON public.doctor_video_rooms
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5. Chat messages
CREATE TABLE IF NOT EXISTS public.doctor_ext_chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid NOT NULL REFERENCES public.doctor_ext_appointments(id) ON DELETE CASCADE,
  doctor_id uuid NOT NULL,
  patient_id uuid NOT NULL,
  sender_id uuid NOT NULL,
  sender_role text NOT NULL DEFAULT 'patient',
  content text,
  attachment_url text,
  attachment_name text,
  attachment_type text,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS doctor_ext_chat_messages_appt_idx
  ON public.doctor_ext_chat_messages (appointment_id, created_at);

GRANT SELECT, INSERT ON public.doctor_ext_chat_messages TO authenticated;
GRANT ALL ON public.doctor_ext_chat_messages TO service_role;
ALTER TABLE public.doctor_ext_chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patients view own chat" ON public.doctor_ext_chat_messages
  FOR SELECT TO authenticated USING (patient_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Patients send own chat" ON public.doctor_ext_chat_messages
  FOR INSERT TO authenticated WITH CHECK (patient_id = auth.uid() AND sender_id = auth.uid());

ALTER PUBLICATION supabase_realtime ADD TABLE public.doctor_ext_chat_messages;
ALTER TABLE public.doctor_ext_chat_messages REPLICA IDENTITY FULL;

-- 6. Storage policies for consult-files bucket
DROP POLICY IF EXISTS "Users upload own consult files" ON storage.objects;
CREATE POLICY "Users upload own consult files" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'consult-files' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Users read own consult files" ON storage.objects;
CREATE POLICY "Users read own consult files" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'consult-files' AND (storage.foldername(name))[1] = auth.uid()::text);