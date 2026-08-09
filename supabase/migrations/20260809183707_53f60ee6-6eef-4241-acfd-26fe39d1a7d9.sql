CREATE INDEX IF NOT EXISTS idx_doctors_external_region_trgm
  ON public.doctors_external USING gin (primary_region gin_trgm_ops);