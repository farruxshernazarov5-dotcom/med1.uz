
-- External doctors catalog (imported from med1.uz dataset)
CREATE TABLE public.doctors_external (
  id UUID NOT NULL PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  rank TEXT,
  experience INTEGER DEFAULT 0,
  photo_url TEXT,
  rating NUMERIC(3,2) DEFAULT 0,
  reviews_count INTEGER DEFAULT 0,
  primary_specialty TEXT,
  primary_region TEXT,
  clinic_id UUID REFERENCES public.registered_clinics(id) ON DELETE SET NULL,
  bio TEXT,
  services TEXT[] DEFAULT '{}',
  languages TEXT[] DEFAULT '{uz,ru}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.doctors_external TO anon, authenticated;
GRANT ALL ON public.doctors_external TO service_role;

ALTER TABLE public.doctors_external ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Doctors external are viewable by everyone"
  ON public.doctors_external FOR SELECT
  USING (true);

CREATE POLICY "Admins manage external doctors"
  ON public.doctors_external FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE INDEX idx_doctors_external_specialty ON public.doctors_external(primary_specialty);
CREATE INDEX idx_doctors_external_region ON public.doctors_external(primary_region);
CREATE INDEX idx_doctors_external_rating ON public.doctors_external(rating DESC);
CREATE INDEX idx_doctors_external_clinic ON public.doctors_external(clinic_id);
CREATE INDEX idx_doctors_external_name_trgm ON public.doctors_external USING gin(name gin_trgm_ops);

CREATE TRIGGER trg_doctors_external_updated
  BEFORE UPDATE ON public.doctors_external
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
