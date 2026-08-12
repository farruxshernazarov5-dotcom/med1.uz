ALTER TABLE public.sponsor_contributions
  ADD COLUMN IF NOT EXISTS bio TEXT,
  ADD COLUMN IF NOT EXISTS occupation TEXT,
  ADD COLUMN IF NOT EXISTS website_url TEXT,
  ADD COLUMN IF NOT EXISTS slug TEXT;

CREATE OR REPLACE FUNCTION public.sponsor_set_slug()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  base TEXT;
  candidate TEXT;
  i INTEGER := 0;
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    base := lower(regexp_replace(coalesce(NEW.display_name, NEW.full_name, 'homiy'), '[^a-zA-Z0-9]+', '-', 'g'));
    base := trim(both '-' from base);
    IF base = '' THEN base := 'homiy'; END IF;
    candidate := base;
    WHILE EXISTS (SELECT 1 FROM public.sponsor_contributions s WHERE s.slug = candidate AND s.id <> NEW.id) LOOP
      i := i + 1;
      candidate := base || '-' || i::text;
    END LOOP;
    NEW.slug := candidate;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sponsor_set_slug ON public.sponsor_contributions;
CREATE TRIGGER trg_sponsor_set_slug
BEFORE INSERT OR UPDATE OF display_name ON public.sponsor_contributions
FOR EACH ROW EXECUTE FUNCTION public.sponsor_set_slug();

UPDATE public.sponsor_contributions SET display_name = display_name WHERE slug IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS sponsor_contributions_slug_key ON public.sponsor_contributions (slug);

DROP FUNCTION IF EXISTS public.get_public_sponsors(INTEGER);
CREATE FUNCTION public.get_public_sponsors(_limit INTEGER DEFAULT 50)
RETURNS TABLE (
  id UUID,
  slug TEXT,
  display_name TEXT,
  region TEXT,
  amount NUMERIC,
  message TEXT,
  bio TEXT,
  occupation TEXT,
  website_url TEXT,
  is_anonymous BOOLEAN,
  created_at TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT sc.id,
         CASE WHEN sc.is_anonymous THEN NULL ELSE sc.slug END,
         CASE WHEN sc.is_anonymous THEN 'Anonim' ELSE sc.display_name END,
         CASE WHEN sc.is_anonymous THEN NULL ELSE sc.region END,
         sc.amount,
         sc.message,
         CASE WHEN sc.is_anonymous THEN NULL ELSE sc.bio END,
         CASE WHEN sc.is_anonymous THEN NULL ELSE sc.occupation END,
         CASE WHEN sc.is_anonymous THEN NULL ELSE sc.website_url END,
         sc.is_anonymous,
         sc.created_at
  FROM public.sponsor_contributions sc
  WHERE sc.status = 'approved'
  ORDER BY sc.amount DESC, sc.created_at ASC
  LIMIT COALESCE(_limit, 50)
$$;

CREATE OR REPLACE FUNCTION public.get_public_sponsor(_slug TEXT)
RETURNS TABLE (
  id UUID,
  slug TEXT,
  display_name TEXT,
  region TEXT,
  amount NUMERIC,
  message TEXT,
  bio TEXT,
  occupation TEXT,
  website_url TEXT,
  created_at TIMESTAMPTZ,
  rank BIGINT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH ranked AS (
    SELECT sc.*, ROW_NUMBER() OVER (ORDER BY sc.amount DESC, sc.created_at ASC) AS rnk
    FROM public.sponsor_contributions sc
    WHERE sc.status = 'approved'
  )
  SELECT r.id, r.slug, r.display_name, r.region, r.amount, r.message,
         r.bio, r.occupation, r.website_url, r.created_at, r.rnk
  FROM ranked r
  WHERE r.slug = _slug AND r.is_anonymous = false
  LIMIT 1
$$;

GRANT EXECUTE ON FUNCTION public.get_public_sponsors(INTEGER) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_sponsor(TEXT) TO anon, authenticated;