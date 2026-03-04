
-- Add new columns to registered_clinics
ALTER TABLE public.registered_clinics
  ADD COLUMN IF NOT EXISTS category text DEFAULT '',
  ADD COLUMN IF NOT EXISTS specialties text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS amenities text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS working_hours jsonb DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS latitude double precision,
  ADD COLUMN IF NOT EXISTS longitude double precision,
  ADD COLUMN IF NOT EXISTS website text DEFAULT '';

-- Create clinic_photos table
CREATE TABLE public.clinic_photos (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id uuid NOT NULL REFERENCES public.registered_clinics(id) ON DELETE CASCADE,
  url text NOT NULL,
  caption text DEFAULT '',
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.clinic_photos ENABLE ROW LEVEL SECURITY;

-- RLS for clinic_photos
CREATE POLICY "Anyone can view clinic photos" ON public.clinic_photos
  FOR SELECT USING (true);

CREATE POLICY "Clinic owners can manage photos" ON public.clinic_photos
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.registered_clinics
      WHERE registered_clinics.id = clinic_photos.clinic_id
        AND registered_clinics.owner_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all photos" ON public.clinic_photos
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Storage bucket for clinic photos
INSERT INTO storage.buckets (id, name, public) VALUES ('clinic-photos', 'clinic-photos', true)
ON CONFLICT DO NOTHING;

-- Storage policies
CREATE POLICY "Anyone can view clinic photos" ON storage.objects
  FOR SELECT USING (bucket_id = 'clinic-photos');

CREATE POLICY "Authenticated users can upload clinic photos" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'clinic-photos' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete own clinic photos" ON storage.objects
  FOR DELETE USING (bucket_id = 'clinic-photos' AND auth.role() = 'authenticated');
