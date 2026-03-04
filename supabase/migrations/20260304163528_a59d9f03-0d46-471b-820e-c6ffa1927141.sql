
-- Add schedule and certificates to doctors
ALTER TABLE public.doctors
  ADD COLUMN IF NOT EXISTS certificates text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS schedule jsonb DEFAULT '{}';

-- Reviews table
CREATE TABLE public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid REFERENCES public.registered_clinics(id) ON DELETE CASCADE NOT NULL,
  doctor_id uuid REFERENCES public.doctors(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL,
  appointment_id uuid REFERENCES public.appointments(id) ON DELETE SET NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text DEFAULT '',
  is_approved boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Only patients who had an appointment can create review
CREATE POLICY "Patients can create reviews" ON public.reviews
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = patient_id);

CREATE POLICY "Patients can view own reviews" ON public.reviews
  FOR SELECT TO authenticated
  USING (auth.uid() = patient_id);

CREATE POLICY "Anyone can view approved reviews" ON public.reviews
  FOR SELECT TO authenticated
  USING (is_approved = true);

CREATE POLICY "Clinic owners can moderate reviews" ON public.reviews
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM registered_clinics
    WHERE registered_clinics.id = reviews.clinic_id
    AND registered_clinics.owner_id = auth.uid()
  ));

CREATE POLICY "Admins can manage all reviews" ON public.reviews
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Add avg_rating to doctors for quick access
ALTER TABLE public.doctors
  ADD COLUMN IF NOT EXISTS avg_rating numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS review_count integer DEFAULT 0;

-- Enable realtime for appointments (for real-time booking)
ALTER PUBLICATION supabase_realtime ADD TABLE public.appointments;
