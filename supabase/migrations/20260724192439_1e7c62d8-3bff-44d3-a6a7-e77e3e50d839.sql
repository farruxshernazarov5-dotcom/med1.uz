CREATE OR REPLACE FUNCTION public.bulk_update_doctor_coords(p jsonb)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  n integer;
BEGIN
  UPDATE public.doctors_external d
  SET latitude = (v->>'lat')::numeric,
      longitude = (v->>'lon')::numeric
  FROM jsonb_array_elements(p) AS v
  WHERE d.id = (v->>'id')::uuid;
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END;
$$;

REVOKE ALL ON FUNCTION public.bulk_update_doctor_coords(jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.bulk_update_doctor_coords(jsonb) TO service_role;