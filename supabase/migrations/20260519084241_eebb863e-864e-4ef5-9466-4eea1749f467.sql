
-- 1) Maternity Beds & Rooms
CREATE TABLE IF NOT EXISTS public.maternity_beds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  center_id uuid NOT NULL,
  room_number text NOT NULL,
  bed_label text NOT NULL,
  room_type text NOT NULL DEFAULT 'standard', -- standard | vip | nicu | labor | delivery
  status text NOT NULL DEFAULT 'available',   -- available | occupied | cleaning | maintenance
  patient_id uuid REFERENCES public.maternity_patients(id) ON DELETE SET NULL,
  occupied_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_mat_beds_center ON public.maternity_beds(center_id);
ALTER TABLE public.maternity_beds ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owners manage own beds" ON public.maternity_beds FOR ALL
  USING (EXISTS (SELECT 1 FROM public.registered_maternity rm WHERE rm.id = center_id AND rm.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.registered_maternity rm WHERE rm.id = center_id AND rm.owner_id = auth.uid()));
CREATE TRIGGER trg_mat_beds_updated BEFORE UPDATE ON public.maternity_beds FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- 2) Maternity Emergencies
CREATE TABLE IF NOT EXISTS public.maternity_emergencies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  center_id uuid NOT NULL,
  patient_id uuid REFERENCES public.maternity_patients(id) ON DELETE SET NULL,
  emergency_type text NOT NULL, -- bleeding | hypertension | fetal_distress | preeclampsia | other
  severity text NOT NULL DEFAULT 'high', -- critical | high | medium
  status text NOT NULL DEFAULT 'active', -- active | resolved | escalated
  description text,
  triggered_by uuid,
  resolved_at timestamptz,
  resolution_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_mat_emerg_center_status ON public.maternity_emergencies(center_id, status);
ALTER TABLE public.maternity_emergencies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owners manage own emergencies" ON public.maternity_emergencies FOR ALL
  USING (EXISTS (SELECT 1 FROM public.registered_maternity rm WHERE rm.id = center_id AND rm.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.registered_maternity rm WHERE rm.id = center_id AND rm.owner_id = auth.uid()));
CREATE TRIGGER trg_mat_emerg_updated BEFORE UPDATE ON public.maternity_emergencies FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- 3) Maternity Antenatal Visits
CREATE TABLE IF NOT EXISTS public.maternity_antenatal_visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  center_id uuid NOT NULL,
  patient_id uuid NOT NULL REFERENCES public.maternity_patients(id) ON DELETE CASCADE,
  visit_date date NOT NULL DEFAULT current_date,
  gestational_week int,
  weight_kg numeric(5,2),
  blood_pressure text,
  fetal_heartbeat int,
  fundal_height_cm numeric(4,1),
  notes text,
  next_visit_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_mat_antenatal_patient ON public.maternity_antenatal_visits(patient_id);
ALTER TABLE public.maternity_antenatal_visits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owners manage antenatal" ON public.maternity_antenatal_visits FOR ALL
  USING (EXISTS (SELECT 1 FROM public.registered_maternity rm WHERE rm.id = center_id AND rm.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.registered_maternity rm WHERE rm.id = center_id AND rm.owner_id = auth.uid()));
CREATE TRIGGER trg_mat_antenatal_updated BEFORE UPDATE ON public.maternity_antenatal_visits FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- 4) Maternity Postpartum Care
CREATE TABLE IF NOT EXISTS public.maternity_postpartum (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  center_id uuid NOT NULL,
  patient_id uuid NOT NULL REFERENCES public.maternity_patients(id) ON DELETE CASCADE,
  delivery_id uuid REFERENCES public.maternity_deliveries(id) ON DELETE SET NULL,
  check_date date NOT NULL DEFAULT current_date,
  days_postpartum int,
  recovery_status text DEFAULT 'normal', -- normal | concerning | critical
  breastfeeding_status text, -- exclusive | mixed | formula
  mood_score int, -- 1-10
  bleeding_status text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_mat_postpartum_patient ON public.maternity_postpartum(patient_id);
ALTER TABLE public.maternity_postpartum ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owners manage postpartum" ON public.maternity_postpartum FOR ALL
  USING (EXISTS (SELECT 1 FROM public.registered_maternity rm WHERE rm.id = center_id AND rm.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.registered_maternity rm WHERE rm.id = center_id AND rm.owner_id = auth.uid()));
CREATE TRIGGER trg_mat_postpartum_updated BEFORE UPDATE ON public.maternity_postpartum FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
