CREATE OR REPLACE FUNCTION public.get_nearby_medical_services(
  _lat double precision,
  _lng double precision,
  _radius_km double precision DEFAULT 15,
  _limit integer DEFAULT 120
)
RETURNS TABLE(
  id uuid,
  org_type text,
  name text,
  logo_url text,
  address text,
  city text,
  phone text,
  latitude double precision,
  longitude double precision,
  distance_km double precision,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  WITH src AS (
    SELECT c.id, 'clinic'::text AS org_type, c.name,
           NULLIF(c.logo_url,'') AS logo_url, NULLIF(c.address,'') AS address,
           NULL::text AS city, NULLIF(c.phone,'') AS phone,
           c.latitude::double precision, c.longitude::double precision, c.created_at
      FROM public.registered_clinics c WHERE c.is_active AND c.latitude IS NOT NULL AND c.longitude IS NOT NULL
    UNION ALL
    SELECT d.id, 'diagnostics', d.name, NULLIF(d.logo_url,''), NULLIF(d.address,''), NULLIF(d.city,''), NULLIF(d.phone,''),
           d.latitude::double precision, d.longitude::double precision, d.created_at
      FROM public.registered_diagnostics d WHERE d.is_active AND d.latitude IS NOT NULL AND d.longitude IS NOT NULL
    UNION ALL
    SELECT p.id, 'pharmacy', p.name, NULLIF(p.logo_url,''), NULLIF(p.address,''), NULLIF(p.city,''), NULLIF(p.phone,''),
           p.latitude::double precision, p.longitude::double precision, p.created_at
      FROM public.registered_pharmacies p WHERE p.is_active AND p.latitude IS NOT NULL AND p.longitude IS NOT NULL
    UNION ALL
    SELECT co.id, 'cosmetology', co.name, NULLIF(co.logo_url,''), NULLIF(co.address,''), NULLIF(co.city,''), NULLIF(co.phone,''),
           co.latitude::double precision, co.longitude::double precision, co.created_at
      FROM public.registered_cosmetology co WHERE co.is_active AND co.latitude IS NOT NULL AND co.longitude IS NOT NULL
    UNION ALL
    SELECT m.id, 'maternity', m.name, NULLIF(m.logo_url,''), NULLIF(m.address,''), NULLIF(m.city,''), NULLIF(m.phone,''),
           m.latitude::double precision, m.longitude::double precision, m.created_at
      FROM public.registered_maternity m WHERE m.is_active AND m.latitude IS NOT NULL AND m.longitude IS NOT NULL
    UNION ALL
    SELECT b.id, 'bloodbank', b.name, NULL::text, NULLIF(b.address,''), NULLIF(b.city,''), NULLIF(b.phone,''),
           b.latitude::double precision, b.longitude::double precision, b.created_at
      FROM public.blood_banks_registered b WHERE b.is_active AND b.latitude IS NOT NULL AND b.longitude IS NOT NULL
    UNION ALL
    SELECT dx.id, 'doctor', dx.name, NULLIF(dx.photo_url,''), NULLIF(dx.primary_region,''), NULLIF(dx.primary_region,''), NULL::text,
           dx.latitude::double precision, dx.longitude::double precision, dx.created_at
      FROM public.doctors_external dx WHERE dx.latitude IS NOT NULL AND dx.longitude IS NOT NULL
  ), calc AS (
    SELECT src.*,
      (6371 * acos(LEAST(1, GREATEST(-1,
        cos(radians(_lat)) * cos(radians(src.latitude)) * cos(radians(src.longitude) - radians(_lng))
        + sin(radians(_lat)) * sin(radians(src.latitude))
      )))) AS distance_km
    FROM src
  )
  SELECT id, org_type, name, logo_url, address, city, phone, latitude, longitude, distance_km, created_at
  FROM calc
  WHERE distance_km <= GREATEST(0.5, LEAST(_radius_km, 200))
  ORDER BY distance_km ASC
  LIMIT GREATEST(1, LEAST(_limit, 300));
$$;

REVOKE ALL ON FUNCTION public.get_nearby_medical_services(double precision, double precision, double precision, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_nearby_medical_services(double precision, double precision, double precision, integer) TO anon, authenticated, service_role;