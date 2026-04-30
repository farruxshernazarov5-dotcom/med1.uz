
-- 1. Staff jadvaliga yangi maydonlar
ALTER TABLE public.diagnostics_staff
  ADD COLUMN IF NOT EXISTS specialization TEXT,
  ADD COLUMN IF NOT EXISTS experience_years INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS department TEXT,
  ADD COLUMN IF NOT EXISTS schedule_type TEXT DEFAULT 'full_time',
  ADD COLUMN IF NOT EXISTS is_on_duty BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS notes TEXT;

-- 2. Lab orders jadvaliga yangi maydonlar
ALTER TABLE public.diagnostics_lab_orders
  ADD COLUMN IF NOT EXISTS assigned_staff_id UUID REFERENCES public.diagnostics_staff(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS order_type TEXT DEFAULT 'lab',
  ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS expected_completion_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'unpaid';

CREATE INDEX IF NOT EXISTS idx_diag_orders_assigned_staff ON public.diagnostics_lab_orders(assigned_staff_id);
CREATE INDEX IF NOT EXISTS idx_diag_orders_status ON public.diagnostics_lab_orders(status);
CREATE INDEX IF NOT EXISTS idx_diag_orders_type ON public.diagnostics_lab_orders(order_type);

-- 3. Schedule jadval
CREATE TABLE IF NOT EXISTS public.diagnostics_staff_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  center_id UUID NOT NULL REFERENCES public.registered_diagnostics(id) ON DELETE CASCADE,
  staff_id UUID NOT NULL REFERENCES public.diagnostics_staff(id) ON DELETE CASCADE,
  work_date DATE NOT NULL,
  shift_start TIME,
  shift_end TIME,
  shift_type TEXT DEFAULT 'morning',
  is_day_off BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(staff_id, work_date)
);

CREATE INDEX IF NOT EXISTS idx_diag_sched_center_date ON public.diagnostics_staff_schedules(center_id, work_date);

ALTER TABLE public.diagnostics_staff_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Center owner manages schedules"
  ON public.diagnostics_staff_schedules FOR ALL
  USING (EXISTS (SELECT 1 FROM public.registered_diagnostics rd WHERE rd.id = center_id AND rd.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.registered_diagnostics rd WHERE rd.id = center_id AND rd.owner_id = auth.uid()));

-- 4. Sample jadval (LAB)
CREATE TABLE IF NOT EXISTS public.diagnostics_samples (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  center_id UUID NOT NULL REFERENCES public.registered_diagnostics(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES public.diagnostics_lab_orders(id) ON DELETE CASCADE,
  sample_code TEXT NOT NULL,
  sample_type TEXT,
  collected_by UUID REFERENCES public.diagnostics_staff(id) ON DELETE SET NULL,
  collected_at TIMESTAMPTZ DEFAULT now(),
  status TEXT DEFAULT 'collected',
  barcode_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_diag_samples_order ON public.diagnostics_samples(order_id);
CREATE INDEX IF NOT EXISTS idx_diag_samples_center ON public.diagnostics_samples(center_id);

ALTER TABLE public.diagnostics_samples ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Center owner manages samples"
  ON public.diagnostics_samples FOR ALL
  USING (EXISTS (SELECT 1 FROM public.registered_diagnostics rd WHERE rd.id = center_id AND rd.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.registered_diagnostics rd WHERE rd.id = center_id AND rd.owner_id = auth.uid()));

-- 5. Radiology jadval (RIS)
CREATE TABLE IF NOT EXISTS public.diagnostics_radiology_studies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  center_id UUID NOT NULL REFERENCES public.registered_diagnostics(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES public.diagnostics_lab_orders(id) ON DELETE CASCADE,
  modality TEXT NOT NULL DEFAULT 'UZI',
  body_part TEXT,
  radiologist_id UUID REFERENCES public.diagnostics_staff(id) ON DELETE SET NULL,
  technician_id UUID REFERENCES public.diagnostics_staff(id) ON DELETE SET NULL,
  images JSONB DEFAULT '[]'::jsonb,
  findings TEXT,
  impression TEXT,
  ai_assistance JSONB,
  status TEXT DEFAULT 'pending',
  performed_at TIMESTAMPTZ,
  reported_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_diag_radio_order ON public.diagnostics_radiology_studies(order_id);
CREATE INDEX IF NOT EXISTS idx_diag_radio_center ON public.diagnostics_radiology_studies(center_id);
CREATE INDEX IF NOT EXISTS idx_diag_radio_modality ON public.diagnostics_radiology_studies(modality);

ALTER TABLE public.diagnostics_radiology_studies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Center owner manages radiology studies"
  ON public.diagnostics_radiology_studies FOR ALL
  USING (EXISTS (SELECT 1 FROM public.registered_diagnostics rd WHERE rd.id = center_id AND rd.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.registered_diagnostics rd WHERE rd.id = center_id AND rd.owner_id = auth.uid()));

-- 6. Notifications jadval
CREATE TABLE IF NOT EXISTS public.diagnostics_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  center_id UUID NOT NULL REFERENCES public.registered_diagnostics(id) ON DELETE CASCADE,
  staff_id UUID REFERENCES public.diagnostics_staff(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  related_order_id UUID REFERENCES public.diagnostics_lab_orders(id) ON DELETE CASCADE,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_diag_notif_center ON public.diagnostics_notifications(center_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_diag_notif_staff ON public.diagnostics_notifications(staff_id, is_read);

ALTER TABLE public.diagnostics_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Center owner manages notifications"
  ON public.diagnostics_notifications FOR ALL
  USING (EXISTS (SELECT 1 FROM public.registered_diagnostics rd WHERE rd.id = center_id AND rd.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.registered_diagnostics rd WHERE rd.id = center_id AND rd.owner_id = auth.uid()));

-- 7. Sequence va trigger (sample code)
CREATE SEQUENCE IF NOT EXISTS public.diag_sample_seq START 1;

DROP TRIGGER IF EXISTS trg_gen_diag_sample_code ON public.diagnostics_samples;
CREATE TRIGGER trg_gen_diag_sample_code
  BEFORE INSERT ON public.diagnostics_samples
  FOR EACH ROW EXECUTE FUNCTION public.generate_diag_sample_code();

-- 8. Auto status timestamps trigger
CREATE OR REPLACE FUNCTION public.diag_order_set_timestamps()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF NEW.status = 'in_progress' AND NEW.started_at IS NULL THEN NEW.started_at := now(); END IF;
    IF NEW.status = 'completed' AND NEW.completed_at IS NULL THEN NEW.completed_at := now(); END IF;
    IF NEW.status = 'accepted' AND NEW.accepted_at IS NULL THEN NEW.accepted_at := now(); END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_diag_order_timestamps ON public.diagnostics_lab_orders;
CREATE TRIGGER trg_diag_order_timestamps
  BEFORE UPDATE ON public.diagnostics_lab_orders
  FOR EACH ROW EXECUTE FUNCTION public.diag_order_set_timestamps();

-- 9. Updated_at triggers
DROP TRIGGER IF EXISTS trg_diag_sched_updated ON public.diagnostics_staff_schedules;
CREATE TRIGGER trg_diag_sched_updated BEFORE UPDATE ON public.diagnostics_staff_schedules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS trg_diag_samples_updated ON public.diagnostics_samples;
CREATE TRIGGER trg_diag_samples_updated BEFORE UPDATE ON public.diagnostics_samples
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS trg_diag_radio_updated ON public.diagnostics_radiology_studies;
CREATE TRIGGER trg_diag_radio_updated BEFORE UPDATE ON public.diagnostics_radiology_studies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- 10. Storage RLS uchun radiology papkasi (diagnostics-files bucketida)
CREATE POLICY "Diag center owner uploads radiology"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'diagnostics-files'
    AND (storage.foldername(name))[1] = 'radiology'
    AND auth.uid()::text = (storage.foldername(name))[2]
  );

CREATE POLICY "Diag center owner reads radiology"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'diagnostics-files'
    AND (storage.foldername(name))[1] = 'radiology'
    AND auth.uid()::text = (storage.foldername(name))[2]
  );

CREATE POLICY "Diag center owner deletes radiology"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'diagnostics-files'
    AND (storage.foldername(name))[1] = 'radiology'
    AND auth.uid()::text = (storage.foldername(name))[2]
  );
