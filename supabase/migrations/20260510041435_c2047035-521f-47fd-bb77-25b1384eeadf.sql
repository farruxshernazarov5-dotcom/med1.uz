-- Geo creative templates managed by admin
CREATE TABLE IF NOT EXISTS public.geo_creative_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL,
  language text NOT NULL DEFAULT 'uz',
  template text NOT NULL,
  priority integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  is_fallback boolean NOT NULL DEFAULT false,
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_geo_creative_templates_cat ON public.geo_creative_templates(category, language, is_active);

ALTER TABLE public.geo_creative_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "geo_templates_admin_all" ON public.geo_creative_templates;
CREATE POLICY "geo_templates_admin_all" ON public.geo_creative_templates
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "geo_templates_read_active" ON public.geo_creative_templates;
CREATE POLICY "geo_templates_read_active" ON public.geo_creative_templates
  FOR SELECT TO anon, authenticated
  USING (is_active = true);

CREATE TRIGGER update_geo_creative_templates_updated_at
BEFORE UPDATE ON public.geo_creative_templates
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Seed defaults (AI fallback library, editable by admin)
INSERT INTO public.geo_creative_templates (category, language, template, is_fallback, priority) VALUES
  ('Stomatolog', 'uz', '🦷 Tabassumingizni unutmang! Sizga yaqin stomatologiyada maxsus chegirma — hoziroq foydalaning.', true, 10),
  ('Kardiolog', 'uz', '❤️ Yuragingizni tekshiring — yonginangizdagi klinikada bepul ko''rik mavjud.', true, 10),
  ('Kosmetolog', 'uz', '💆‍♀️ O''zingizga vaqt ajrating ✨ Yaqin kosmetologiya markazida bonusli xizmatlar.', true, 10),
  ('Pediatr', 'uz', '👶 Bolangiz salomatligi — eng muhimi. Yaqin pediatriya markazida aksiya bor.', true, 10),
  ('Diagnostika', 'uz', '🔬 Sog''ligingizni tekshiring — yaqin laboratoriyada chegirmali tahlillar.', true, 10),
  ('Default', 'uz', '📍 Sizga yaqin tibbiy markazda maxsus aksiya — ko''rib chiqing!', true, 5)
ON CONFLICT DO NOTHING;