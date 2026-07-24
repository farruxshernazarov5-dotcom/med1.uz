
ALTER TABLE public.doctors_external
  ADD COLUMN IF NOT EXISTS latitude double precision,
  ADD COLUMN IF NOT EXISTS longitude double precision;

CREATE INDEX IF NOT EXISTS doctors_external_lat_lng_idx
  ON public.doctors_external (latitude, longitude)
  WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

CREATE INDEX IF NOT EXISTS doctors_external_specialty_region_idx
  ON public.doctors_external (primary_specialty, primary_region);
