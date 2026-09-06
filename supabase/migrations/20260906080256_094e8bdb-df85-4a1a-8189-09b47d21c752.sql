CREATE TABLE public.entity_media_links (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  entity_type text not null,
  entity_id uuid,
  staff_id uuid,
  kind text not null default 'social',
  platform text not null default 'other',
  url text not null,
  title text,
  description text,
  thumbnail_url text,
  sort_order int not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint entity_media_links_kind_chk check (kind in ('social','video'))
);

CREATE INDEX idx_eml_entity ON public.entity_media_links (entity_type, entity_id);
CREATE INDEX idx_eml_staff ON public.entity_media_links (staff_id);
CREATE INDEX idx_eml_owner ON public.entity_media_links (owner_id);

GRANT SELECT ON public.entity_media_links TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.entity_media_links TO authenticated;
GRANT ALL ON public.entity_media_links TO service_role;

ALTER TABLE public.entity_media_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view published media links"
ON public.entity_media_links FOR SELECT
USING (is_published = true);

CREATE POLICY "Owners can view own media links"
ON public.entity_media_links FOR SELECT TO authenticated
USING (owner_id = auth.uid());

CREATE POLICY "Owners can insert media links"
ON public.entity_media_links FOR INSERT TO authenticated
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owners can update own media links"
ON public.entity_media_links FOR UPDATE TO authenticated
USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owners can delete own media links"
ON public.entity_media_links FOR DELETE TO authenticated
USING (owner_id = auth.uid());

CREATE TRIGGER trg_eml_updated_at
BEFORE UPDATE ON public.entity_media_links
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();