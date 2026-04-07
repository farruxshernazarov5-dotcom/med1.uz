
-- Dental files table
CREATE TABLE public.dental_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES public.registered_dental_clinics(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES public.dental_patients(id) ON DELETE SET NULL,
  module TEXT NOT NULL DEFAULT 'general',
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size TEXT,
  category TEXT NOT NULL DEFAULT 'other',
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.dental_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Dental clinic owners manage their files"
  ON public.dental_files FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.registered_dental_clinics c WHERE c.id = clinic_id AND c.owner_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.registered_dental_clinics c WHERE c.id = clinic_id AND c.owner_id = auth.uid())
  );

-- Dental equipment table
CREATE TABLE public.dental_equipment (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES public.registered_dental_clinics(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'other',
  model TEXT,
  serial_number TEXT,
  room TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  purchase_date DATE,
  warranty_end DATE,
  purchase_price NUMERIC,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.dental_equipment ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Dental clinic owners manage their equipment"
  ON public.dental_equipment FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.registered_dental_clinics c WHERE c.id = clinic_id AND c.owner_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.registered_dental_clinics c WHERE c.id = clinic_id AND c.owner_id = auth.uid())
  );

-- Dental equipment maintenance log
CREATE TABLE public.dental_equipment_maintenance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  equipment_id UUID NOT NULL REFERENCES public.dental_equipment(id) ON DELETE CASCADE,
  clinic_id UUID NOT NULL REFERENCES public.registered_dental_clinics(id) ON DELETE CASCADE,
  service_date DATE NOT NULL DEFAULT CURRENT_DATE,
  service_type TEXT NOT NULL DEFAULT 'routine',
  notes TEXT,
  cost NUMERIC DEFAULT 0,
  technician_name TEXT,
  next_service_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.dental_equipment_maintenance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Dental clinic owners manage maintenance logs"
  ON public.dental_equipment_maintenance FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.registered_dental_clinics c WHERE c.id = clinic_id AND c.owner_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.registered_dental_clinics c WHERE c.id = clinic_id AND c.owner_id = auth.uid())
  );

-- Dental lab orders table
CREATE TABLE public.dental_lab_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES public.registered_dental_clinics(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.dental_patients(id) ON DELETE CASCADE,
  tooth_number INTEGER,
  work_type TEXT NOT NULL,
  doctor_name TEXT,
  technician_name TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  price NUMERIC DEFAULT 0,
  external_lab TEXT,
  due_date DATE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.dental_lab_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Dental clinic owners manage lab orders"
  ON public.dental_lab_orders FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.registered_dental_clinics c WHERE c.id = clinic_id AND c.owner_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.registered_dental_clinics c WHERE c.id = clinic_id AND c.owner_id = auth.uid())
  );

-- Storage bucket for dental files
INSERT INTO storage.buckets (id, name, public) VALUES ('dental-files', 'dental-files', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Dental file owners can upload"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'dental-files' AND auth.uid() IS NOT NULL);

CREATE POLICY "Dental file owners can view"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'dental-files' AND auth.uid() IS NOT NULL);

CREATE POLICY "Dental file owners can delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'dental-files' AND auth.uid() IS NOT NULL);

-- Update triggers
CREATE TRIGGER update_dental_equipment_updated_at
  BEFORE UPDATE ON public.dental_equipment
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_dental_lab_orders_updated_at
  BEFORE UPDATE ON public.dental_lab_orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
