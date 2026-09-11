CREATE TABLE public.org_gallery_photos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL,
  org_type TEXT NOT NULL,
  org_id UUID,
  branch_name TEXT,
  title TEXT,
  description TEXT,
  url TEXT NOT NULL,
  storage_path TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_org_gallery_org ON public.org_gallery_photos (org_type, org_id, sort_order);
CREATE INDEX idx_org_gallery_owner ON public.org_gallery_photos (owner_id);

GRANT SELECT ON public.org_gallery_photos TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.org_gallery_photos TO authenticated;
GRANT ALL ON public.org_gallery_photos TO service_role;

ALTER TABLE public.org_gallery_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active gallery photos"
ON public.org_gallery_photos FOR SELECT
USING (is_active = true);

CREATE POLICY "Owners manage their gallery photos"
ON public.org_gallery_photos FOR ALL
TO authenticated
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);

CREATE TRIGGER update_org_gallery_photos_updated_at
BEFORE UPDATE ON public.org_gallery_photos
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();