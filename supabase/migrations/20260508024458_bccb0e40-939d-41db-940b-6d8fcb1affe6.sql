-- Add geolocation preferences to user profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS preferred_latitude double precision,
  ADD COLUMN IF NOT EXISTS preferred_longitude double precision,
  ADD COLUMN IF NOT EXISTS preferred_radius_km integer DEFAULT 10,
  ADD COLUMN IF NOT EXISTS preferred_city text DEFAULT '';

-- Add service radius / coverage settings to clinics
ALTER TABLE public.registered_clinics
  ADD COLUMN IF NOT EXISTS service_radius_km integer DEFAULT 15,
  ADD COLUMN IF NOT EXISTS service_city text DEFAULT '',
  ADD COLUMN IF NOT EXISTS accepts_remote_patients boolean DEFAULT true;