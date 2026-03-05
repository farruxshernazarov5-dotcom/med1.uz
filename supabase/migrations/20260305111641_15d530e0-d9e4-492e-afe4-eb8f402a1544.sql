
-- Tibbiy tarix jadvali (tashxislar, analiz natijalari)
CREATE TABLE public.medical_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  record_type text NOT NULL DEFAULT 'diagnosis',
  title text NOT NULL,
  description text DEFAULT '',
  doctor_name text DEFAULT '',
  clinic_name text DEFAULT '',
  record_date date NOT NULL DEFAULT CURRENT_DATE,
  attachments text[] DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.medical_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own medical records" ON public.medical_records FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own medical records" ON public.medical_records FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own medical records" ON public.medical_records FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own medical records" ON public.medical_records FOR DELETE USING (auth.uid() = user_id);

-- Medical documents storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('medical-documents', 'medical-documents', false);

CREATE POLICY "Users can upload own medical docs" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'medical-documents' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can view own medical docs" ON storage.objects FOR SELECT USING (bucket_id = 'medical-documents' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can delete own medical docs" ON storage.objects FOR DELETE USING (bucket_id = 'medical-documents' AND (storage.foldername(name))[1] = auth.uid()::text);
