
-- ========== 1. doctor_patients ga statistik counterlar qo'shish ==========
ALTER TABLE public.doctor_patients
  ADD COLUMN IF NOT EXISTS total_visits INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_lab_orders INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_prescriptions INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_records INTEGER NOT NULL DEFAULT 0;

-- ========== 2. Avto-sync: appointment -> doctor_patients ==========
CREATE OR REPLACE FUNCTION public.sync_appointment_to_doctor_patients()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_existing_id UUID;
BEGIN
  -- Faqat doctor_id mavjud bo'lsa
  IF NEW.doctor_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Mavjud bemor borligini tekshirish (doctor_id + phone bo'yicha)
  SELECT id INTO v_existing_id
  FROM public.doctor_patients
  WHERE doctor_id = NEW.doctor_id AND phone = NEW.patient_phone
  LIMIT 1;

  IF v_existing_id IS NULL THEN
    -- Yangi bemor qo'shamiz
    INSERT INTO public.doctor_patients (
      doctor_id, patient_user_id, full_name, phone,
      source, appointment_id, last_visit_date, total_visits
    ) VALUES (
      NEW.doctor_id, NEW.patient_id, NEW.patient_name, NEW.patient_phone,
      'appointment', NEW.id, NEW.appointment_date::timestamptz,
      CASE WHEN NEW.status = 'completed' THEN 1 ELSE 0 END
    );
  ELSIF NEW.status = 'completed' AND (OLD IS NULL OR OLD.status IS DISTINCT FROM 'completed') THEN
    -- Mavjud bemor: tashrif sonini oshirish
    UPDATE public.doctor_patients
    SET total_visits = total_visits + 1,
        last_visit_date = NEW.appointment_date::timestamptz,
        updated_at = now()
    WHERE id = v_existing_id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_appointment_to_doctor_patients ON public.appointments;
CREATE TRIGGER trg_sync_appointment_to_doctor_patients
AFTER INSERT OR UPDATE OF status ON public.appointments
FOR EACH ROW EXECUTE FUNCTION public.sync_appointment_to_doctor_patients();

-- ========== 3. Counter: doctor_records -> doctor_patients.total_records ==========
CREATE OR REPLACE FUNCTION public.update_doctor_patient_counters()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_patient_id UUID;
  v_field TEXT;
  v_delta INT;
BEGIN
  v_field := TG_ARGV[0];

  IF TG_OP = 'INSERT' THEN
    v_patient_id := NEW.patient_id;
    v_delta := 1;
  ELSIF TG_OP = 'DELETE' THEN
    v_patient_id := OLD.patient_id;
    v_delta := -1;
  ELSE
    RETURN NEW;
  END IF;

  IF v_patient_id IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  EXECUTE format(
    'UPDATE public.doctor_patients SET %I = GREATEST(0, %I + $1), updated_at = now() WHERE id = $2',
    v_field, v_field
  ) USING v_delta, v_patient_id;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_count_records ON public.doctor_records;
CREATE TRIGGER trg_count_records
AFTER INSERT OR DELETE ON public.doctor_records
FOR EACH ROW EXECUTE FUNCTION public.update_doctor_patient_counters('total_records');

DROP TRIGGER IF EXISTS trg_count_lab_orders ON public.doctor_lab_orders;
CREATE TRIGGER trg_count_lab_orders
AFTER INSERT OR DELETE ON public.doctor_lab_orders
FOR EACH ROW EXECUTE FUNCTION public.update_doctor_patient_counters('total_lab_orders');

-- ========== 4. Realtime publication uchun barcha doctor_* jadvallar ==========
ALTER TABLE public.doctor_patients REPLICA IDENTITY FULL;
ALTER TABLE public.doctor_records REPLICA IDENTITY FULL;
ALTER TABLE public.doctor_lab_orders REPLICA IDENTITY FULL;
ALTER TABLE public.doctor_treatment_plans REPLICA IDENTITY FULL;
ALTER TABLE public.doctor_files REPLICA IDENTITY FULL;
ALTER TABLE public.doctor_leads REPLICA IDENTITY FULL;

DO $$
BEGIN
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.doctor_patients; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.doctor_records; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.doctor_lab_orders; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.doctor_treatment_plans; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.doctor_files; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.doctor_leads; EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;

-- ========== 5. Indexlar ==========
CREATE INDEX IF NOT EXISTS idx_doctor_records_patient ON public.doctor_records(patient_id);
CREATE INDEX IF NOT EXISTS idx_doctor_lab_patient ON public.doctor_lab_orders(patient_id);
CREATE INDEX IF NOT EXISTS idx_doctor_plans_patient ON public.doctor_treatment_plans(patient_id);
CREATE INDEX IF NOT EXISTS idx_doctor_files_patient ON public.doctor_files(patient_id);
