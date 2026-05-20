
-- ============================================================
-- LEGAL CONTRACT MANAGEMENT SYSTEM — Phase 1: DB Core
-- ============================================================

-- ENUMS
DO $$ BEGIN
  CREATE TYPE public.contract_status AS ENUM ('draft','pending_signature','active','expired','terminated','cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.signature_method AS ENUM ('otp','canvas','otp_canvas','checkbox');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.contract_party_role AS ENUM ('platform','clinic','partner','patient','api_partner','organization','staff');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
-- 1. CONTRACT CATEGORIES (service types)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.contract_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name_uz TEXT NOT NULL,
  name_ru TEXT NOT NULL,
  description_uz TEXT,
  description_ru TEXT,
  icon TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.contract_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can read active categories"
  ON public.contract_categories FOR SELECT TO authenticated
  USING (is_active = true OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage categories"
  ON public.contract_categories FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- 2. CONTRACT TEMPLATES (versioned master library)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.contract_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES public.contract_categories(id) ON DELETE SET NULL,
  slug TEXT NOT NULL UNIQUE,
  title_uz TEXT NOT NULL,
  title_ru TEXT NOT NULL,
  summary_uz TEXT,
  summary_ru TEXT,
  body_uz TEXT NOT NULL,
  body_ru TEXT NOT NULL,
  variables JSONB NOT NULL DEFAULT '[]'::jsonb,
  required_signature signature_method NOT NULL DEFAULT 'otp_canvas',
  valid_for_days INT,
  current_version TEXT NOT NULL DEFAULT '1.0.0',
  allowed_roles TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  jurisdiction TEXT NOT NULL DEFAULT 'UZ',
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_mandatory BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_contract_templates_category ON public.contract_templates(category_id);
CREATE INDEX idx_contract_templates_active ON public.contract_templates(is_active) WHERE is_active = true;

ALTER TABLE public.contract_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read active templates"
  ON public.contract_templates FOR SELECT TO authenticated
  USING (is_active = true OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage templates"
  ON public.contract_templates FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- 3. CONTRACT TEMPLATE VERSIONS (history)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.contract_template_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES public.contract_templates(id) ON DELETE CASCADE,
  version TEXT NOT NULL,
  title_uz TEXT NOT NULL,
  title_ru TEXT NOT NULL,
  body_uz TEXT NOT NULL,
  body_ru TEXT NOT NULL,
  change_notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(template_id, version)
);

CREATE INDEX idx_ctv_template ON public.contract_template_versions(template_id, created_at DESC);

ALTER TABLE public.contract_template_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read versions"
  ON public.contract_template_versions FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins manage versions"
  ON public.contract_template_versions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- 4. CONTRACTS (actual user/org instances)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_number TEXT NOT NULL UNIQUE,
  template_id UUID REFERENCES public.contract_templates(id) ON DELETE RESTRICT,
  template_version TEXT NOT NULL,
  category_slug TEXT,
  title_uz TEXT NOT NULL,
  title_ru TEXT NOT NULL,
  body_uz TEXT NOT NULL,
  body_ru TEXT NOT NULL,
  filled_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  owner_role contract_party_role NOT NULL DEFAULT 'patient',
  counterparty_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  counterparty_name TEXT,
  organization_id UUID,
  status contract_status NOT NULL DEFAULT 'pending_signature',
  language TEXT NOT NULL DEFAULT 'uz',
  effective_from TIMESTAMPTZ,
  effective_until TIMESTAMPTZ,
  signed_at TIMESTAMPTZ,
  terminated_at TIMESTAMPTZ,
  terminated_reason TEXT,
  pdf_url TEXT,
  pdf_watermark TEXT,
  hash_id TEXT NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
  meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_contracts_owner ON public.contracts(owner_id);
CREATE INDEX idx_contracts_status ON public.contracts(status);
CREATE INDEX idx_contracts_template ON public.contracts(template_id);
CREATE INDEX idx_contracts_expiry ON public.contracts(effective_until) WHERE effective_until IS NOT NULL;

CREATE SEQUENCE IF NOT EXISTS public.contract_seq START 1;

CREATE OR REPLACE FUNCTION public.generate_contract_number()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.contract_number IS NULL OR NEW.contract_number = '' THEN
    NEW.contract_number := 'LGL-' || EXTRACT(YEAR FROM now())::text || '-' ||
                           LPAD(nextval('public.contract_seq')::text, 7, '0');
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_contracts_number
  BEFORE INSERT ON public.contracts
  FOR EACH ROW EXECUTE FUNCTION public.generate_contract_number();

CREATE TRIGGER trg_contracts_updated
  BEFORE UPDATE ON public.contracts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner and counterparty read own contracts"
  ON public.contracts FOR SELECT TO authenticated
  USING (
    owner_id = auth.uid()
    OR counterparty_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Owner can insert own contracts"
  ON public.contracts FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Owner update own pending contracts"
  ON public.contracts FOR UPDATE TO authenticated
  USING (owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete contracts"
  ON public.contracts FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- 5. CONTRACT SIGNATURES (e-signatures)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.contract_signatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  signer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  signer_role contract_party_role NOT NULL DEFAULT 'patient',
  signer_name TEXT NOT NULL,
  signer_email TEXT,
  signer_phone TEXT,
  method signature_method NOT NULL DEFAULT 'otp_canvas',
  signature_image_url TEXT,
  signature_hash TEXT NOT NULL,
  otp_verified BOOLEAN NOT NULL DEFAULT false,
  otp_channel TEXT,
  ip_address TEXT,
  user_agent TEXT,
  device_type TEXT,
  geo_country TEXT,
  geo_city TEXT,
  signed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_valid BOOLEAN NOT NULL DEFAULT true,
  revoked_at TIMESTAMPTZ,
  revoked_reason TEXT
);

CREATE INDEX idx_signatures_contract ON public.contract_signatures(contract_id);
CREATE INDEX idx_signatures_signer ON public.contract_signatures(signer_id);

ALTER TABLE public.contract_signatures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Signer and contract owner read signatures"
  ON public.contract_signatures FOR SELECT TO authenticated
  USING (
    signer_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.contracts c WHERE c.id = contract_id AND (c.owner_id = auth.uid() OR c.counterparty_id = auth.uid()))
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Signer can insert own signature"
  ON public.contract_signatures FOR INSERT TO authenticated
  WITH CHECK (signer_id = auth.uid());

CREATE POLICY "Admins can manage signatures"
  ON public.contract_signatures FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- 6. CONTRACT SIGNATURE OTPs (temporary)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.contract_signature_otps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  otp_code TEXT NOT NULL,
  channel TEXT NOT NULL DEFAULT 'email',
  destination TEXT NOT NULL,
  attempts INT NOT NULL DEFAULT 0,
  consumed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '10 minutes'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_signature_otps_contract_user ON public.contract_signature_otps(contract_id, user_id);

ALTER TABLE public.contract_signature_otps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User reads own OTPs"
  ON public.contract_signature_otps FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "User inserts own OTP requests"
  ON public.contract_signature_otps FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "User updates own OTP"
  ON public.contract_signature_otps FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- 7. CONTRACT ACCESS LOG (audit)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.contract_access_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_contract_access_contract ON public.contract_access_log(contract_id, created_at DESC);

ALTER TABLE public.contract_access_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read access log"
  ON public.contract_access_log FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated can write log entries"
  ON public.contract_access_log FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

-- ============================================================
-- 8. CONTRACT NOTIFICATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.contract_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID REFERENCES public.contracts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_contract_notifs_user ON public.contract_notifications(user_id, created_at DESC);

ALTER TABLE public.contract_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User reads own contract notifications"
  ON public.contract_notifications FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "User updates own contract notifications"
  ON public.contract_notifications FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins insert contract notifications"
  ON public.contract_notifications FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- 9. STORAGE BUCKET: legal-contracts (private)
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('legal-contracts', 'legal-contracts', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users read own legal-contracts files"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'legal-contracts'
    AND (auth.uid()::text = (storage.foldername(name))[1] OR public.has_role(auth.uid(), 'admin'))
  );

CREATE POLICY "Users upload own legal-contracts files"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'legal-contracts'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Admins manage legal-contracts files"
  ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'legal-contracts' AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (bucket_id = 'legal-contracts' AND public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- 10. SEED CATEGORIES
-- ============================================================
INSERT INTO public.contract_categories (slug, name_uz, name_ru, icon, sort_order) VALUES
  ('clinic', 'Klinika HMS', 'Клиника HMS', 'Hospital', 1),
  ('diagnostics', 'Diagnostika LIS', 'Диагностика LIS', 'TestTube', 2),
  ('maternity', 'Tug''ruqxona HMS', 'Родильный дом HMS', 'Baby', 3),
  ('dental', 'Stomatologiya', 'Стоматология', 'Smile', 4),
  ('pharmacy', 'Dorixona', 'Аптека', 'Pill', 5),
  ('insurance', 'Sug''urta', 'Страхование', 'ShieldCheck', 6),
  ('api', 'API integratsiya', 'API интеграция', 'Webhook', 7),
  ('ai', 'AI xizmatlar', 'AI сервисы', 'Brain', 8),
  ('saas', 'SaaS obuna', 'SaaS подписка', 'CreditCard', 9),
  ('referral', 'Referral & Promo', 'Реферал & Промо', 'Gift', 10),
  ('patient', 'Bemor portali', 'Портал пациента', 'User', 11),
  ('dpa', 'Ma''lumotlar qayta ishlash (DPA)', 'Обработка данных (DPA)', 'Database', 12),
  ('privacy', 'Maxfiylik siyosati', 'Политика конфиденциальности', 'Lock', 13),
  ('compliance', 'HIPAA/GDPR Compliance', 'HIPAA/GDPR Соответствие', 'ScrollText', 14),
  ('ai-disclaimer', 'AI Disclaimer', 'AI Дисклеймер', 'AlertTriangle', 15)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- 11. SEED 15+ STANDARD TEMPLATES (UZ + RU)
-- ============================================================
WITH cats AS (SELECT id, slug FROM public.contract_categories)
INSERT INTO public.contract_templates (
  category_id, slug, title_uz, title_ru, summary_uz, summary_ru,
  body_uz, body_ru, required_signature, allowed_roles, is_mandatory, current_version
)
SELECT cats.id, t.slug, t.title_uz, t.title_ru, t.summary_uz, t.summary_ru,
       t.body_uz, t.body_ru, t.req_sig::signature_method, t.roles, t.mandatory, '1.0.0'
FROM cats
JOIN (VALUES
  ('clinic', 'clinic-hms-agreement',
    'Klinika HMS Foydalanish Shartnomasi', 'Договор использования Клиника HMS',
    'Klinika tomonidan MED1.UZ HMS tizimidan foydalanish bo''yicha to''liq shartnoma',
    'Полный договор использования системы HMS MED1.UZ медицинским учреждением',
    E'# Klinika HMS Foydalanish Shartnomasi\n\n**1. Tomonlar**\nMED-ALL AI SYSTEM MCHJ (Platforma) va Klinika (Foydalanuvchi).\n\n**2. Xizmat tavsifi**\nPlatforma klinikani boshqarish uchun bulutli HMS (Hospital Management System) tizimini taqdim etadi: bemorlar bazasi, qabul, EMR, retsept, hisob-kitob, statistika.\n\n**3. Tomonlar majburiyati**\n- Klinika: bemorlar ma''lumotlari to''g''riligi va qonuniyligi uchun javobgar\n- Platforma: tizim ishlashi va xavfsizligini ta''minlaydi (SLA 99.5%)\n\n**4. To''lov shartlari**\nObuna tarifi tanlangan SaaS rejasiga muvofiq oylik/yillik to''lanadi.\n\n**5. Ma''lumotlar xavfsizligi**\nBarcha bemor ma''lumotlari shifrlangan holda saqlanadi (AES-256). Faqat klinika xodimlari kira oladi.\n\n**6. Maxfiylik**\nTomonlar bir-birining maxfiy ma''lumotlarini uchinchi shaxslarga oshkor etmaydi.\n\n**7. Liability cheklovi**\nPlatforma faqat texnologik vositachi. Klinika va bemor o''rtasidagi tibbiy nizolar uchun Platforma javobgar emas. Tibbiy qarorlar uchun shifokor javobgar.\n\n**8. Subscription va bekor qilish**\nObuna istalgan paytda bekor qilinishi mumkin. Refund siyosati: 14 kun ichida 100% qaytarib beriladi.\n\n**9. Intellektual mulk**\nPlatforma kodi, dizayni va brendi MED-ALL AI SYSTEM MCHJ ga tegishli.\n\n**10. Nizolarni hal qilish**\nO''zbekiston Respublikasi qonunchiligi asosida, Toshkent shahar sudlari orqali.\n\n**11. Compliance**\nO''zRq "Persona ma''lumotlari to''g''risida" qonuniga muvofiq.\n',
    E'# Договор использования Клиника HMS\n\n**1. Стороны**\nMED-ALL AI SYSTEM ООО (Платформа) и Клиника (Пользователь).\n\n**2. Описание услуги**\nПлатформа предоставляет облачную систему HMS: база пациентов, приём, EMR, рецепты, расчёты, статистика.\n\n**3. Обязательства сторон**\n- Клиника: ответственна за достоверность данных пациентов\n- Платформа: обеспечивает работу и безопасность (SLA 99.5%)\n\n**4. Условия оплаты**\nПодписка оплачивается ежемесячно/ежегодно согласно выбранному тарифу.\n\n**5. Безопасность данных**\nВсе данные пациентов хранятся зашифрованными (AES-256).\n\n**6. Конфиденциальность**\nСтороны не разглашают конфиденциальную информацию третьим лицам.\n\n**7. Ограничение ответственности**\nПлатформа — только технологический посредник. Не несёт ответственности за медицинские споры между клиникой и пациентом.\n\n**8. Подписка и отмена**\nВозврат в течение 14 дней — 100%.\n\n**9. Интеллектуальная собственность**\nПринадлежит MED-ALL AI SYSTEM ООО.\n\n**10. Разрешение споров**\nЗаконодательство Республики Узбекистан, суды г. Ташкент.\n\n**11. Соответствие**\nЗакон РУз "О персональных данных".\n',
    'otp_canvas', ARRAY['clinic','admin'], true),

  ('diagnostics', 'diagnostics-lis-agreement',
    'Diagnostika LIS Foydalanish Shartnomasi', 'Договор использования Диагностика LIS',
    'Laboratoriya axborot tizimi (LIS) foydalanish shartlari',
    'Условия использования лабораторной информационной системы (LIS)',
    E'# Diagnostika LIS Shartnomasi\n\n**1. Tomonlar:** MED-ALL AI SYSTEM MCHJ va Diagnostika markazi.\n\n**2. Xizmat:** LIS — namuna boshqaruvi, natijalar, QR verify, ICD-10 integratsiya.\n\n**3. Majburiyatlar:** Markaz — natijalar to''g''riligi; Platforma — tizim ishlashi (SLA 99.5%).\n\n**4. To''lov:** Tanlangan tarif bo''yicha oylik.\n\n**5. Maxfiylik:** Lab natijalari shifrlangan saqlanadi.\n\n**6. Liability:** Platforma tibbiy xulosaga javobgar emas — laboratoriya shifokori javobgar.\n\n**7. Refund:** 14 kun.\n\n**8. Nizolar:** O''zR qonunchiligi.\n',
    E'# Договор Диагностика LIS\n\n**1. Стороны:** MED-ALL AI SYSTEM ООО и Диагностический центр.\n\n**2. Услуга:** LIS — управление образцами, результаты, QR-верификация, ICD-10.\n\n**3. Обязательства:** Центр — достоверность; Платформа — работа системы.\n\n**4. Оплата:** Ежемесячно по тарифу.\n\n**5. Конфиденциальность:** Шифрование результатов.\n\n**6. Ответственность:** Платформа не отвечает за мед. заключения.\n\n**7. Возврат:** 14 дней.\n\n**8. Споры:** Законы РУз.\n',
    'otp_canvas', ARRAY['diagnostics','admin'], true),

  ('maternity', 'maternity-hms-agreement',
    'Tug''ruqxona HMS Shartnomasi', 'Договор Родильный дом HMS',
    'Maternity HMS tizimidan foydalanish shartlari',
    'Условия использования системы Maternity HMS',
    E'# Tug''ruqxona HMS Shartnomasi\n\n**1. Tomonlar:** Platforma va Tug''ruqxona.\n\n**2. Xizmat:** Maternity HMS — homiladorlik kuzatuvi, tug''ruq, neonatal monitoring, antenatal/postpartum.\n\n**3. Sensitiv ma''lumotlar:** Ona va chaqaloq ma''lumotlari oliy darajadagi himoyada (AES-256, audit logs).\n\n**4. Liability:** Platforma tibbiy qarorlarga javobgar emas.\n\n**5. AI tavsiyalari:** Faqat ma''lumot uchun, professional tashxis o''rnini bosmaydi.\n\n**6. Refund:** 14 kun.\n\n**7. Nizolar:** O''zR qonunchiligi.\n',
    E'# Договор Maternity HMS\n\n**1. Стороны:** Платформа и Родильный дом.\n\n**2. Услуга:** Наблюдение беременности, роды, неонатальный мониторинг.\n\n**3. Чувствительные данные:** Высший уровень защиты (AES-256).\n\n**4. Ответственность:** Платформа не отвечает за мед. решения.\n\n**5. AI рекомендации:** Только информативно.\n\n**6. Возврат:** 14 дней.\n\n**7. Споры:** Законы РУз.\n',
    'otp_canvas', ARRAY['maternity','admin'], true),

  ('dental', 'dental-hms-agreement',
    'Stomatologiya HMS Shartnomasi', 'Договор Стоматология HMS',
    'Dental clinic uchun foydalanish shartlari',
    'Условия использования для стоматологии',
    E'# Stomatologiya HMS Shartnomasi\n\n**1. Tomonlar:** Platforma va Stomatologiya markazi.\n\n**2. Xizmat:** Tooth chart (FDI), davolanish rejasi, lab orders, OPG/RVG/CBCT vault.\n\n**3. Lab integratsiya:** Lab buyurtmalari avtomatik invoice ga sinxronlanadi.\n\n**4. Liability:** Platforma davolanish natijalariga javobgar emas.\n\n**5. Refund:** 14 kun.\n\n**6. Nizolar:** O''zR qonunchiligi.\n',
    E'# Договор Стоматология HMS\n\n**1. Стороны:** Платформа и Стомат. центр.\n\n**2. Услуга:** Tooth chart (FDI), план лечения, лаб. заказы, OPG/RVG/CBCT.\n\n**3. Лаб. интеграция:** Авто-синхронизация с инвойсами.\n\n**4. Ответственность:** Платформа не отвечает за результаты лечения.\n\n**5. Возврат:** 14 дней.\n\n**6. Споры:** Законы РУз.\n',
    'otp_canvas', ARRAY['dental','admin'], true),

  ('pharmacy', 'pharmacy-agreement',
    'Dorixona Tizimi Shartnomasi', 'Договор системы Аптека',
    'Pharmacy POS va inventory boshqaruv shartlari',
    'Условия Pharmacy POS и управления складом',
    E'# Dorixona Tizimi Shartnomasi\n\n**1. Tomonlar:** Platforma va Dorixona.\n\n**2. Xizmat:** POS, inventory, retsept tekshiruvi, eksport hisobotlar.\n\n**3. Recipe verification:** Platforma faqat ma''lumot beradi — yakuniy qaror farmatsevtga tegishli.\n\n**4. Liability:** Dori sotish qonuniyligi uchun dorixona javobgar.\n\n**5. Refund:** 14 kun.\n\n**6. Nizolar:** O''zR qonunchiligi.\n',
    E'# Договор Аптеки\n\n**1. Стороны:** Платформа и Аптека.\n\n**2. Услуга:** POS, склад, проверка рецептов.\n\n**3. Проверка рецептов:** Окончательное решение — за фармацевтом.\n\n**4. Ответственность:** За законность продажи — аптека.\n\n**5. Возврат:** 14 дней.\n\n**6. Споры:** Законы РУз.\n',
    'otp_canvas', ARRAY['pharmacy','admin'], true),

  ('insurance', 'insurance-agreement',
    'Sug''urta Moduli Shartnomasi', 'Договор Страхового модуля',
    'Insurance claims va split payment shartlari',
    'Страховые требования и split-платежи',
    E'# Sug''urta Moduli Shartnomasi\n\n**1. Tomonlar:** Platforma, Klinika va Sug''urta kompaniyasi.\n\n**2. Xizmat:** Claims management, payment splits, status tracking.\n\n**3. Sug''urta to''lovlari:** To''g''ridan-to''g''ri sug''urta kompaniyasi va klinika o''rtasida.\n\n**4. Platforma roli:** Faqat texnik vositachi.\n\n**5. Refund:** 14 kun.\n\n**6. Nizolar:** O''zR qonunchiligi.\n',
    E'# Договор Страхового модуля\n\n**1. Стороны:** Платформа, Клиника, Страховая.\n\n**2. Услуга:** Управление claims, split-платежи.\n\n**3. Выплаты:** Напрямую между страховой и клиникой.\n\n**4. Роль платформы:** Только техн. посредник.\n\n**5. Возврат:** 14 дней.\n\n**6. Споры:** Законы РУз.\n',
    'otp_canvas', ARRAY['insurance','clinic','admin'], true),

  ('api', 'api-integration-agreement',
    'API Integration Agreement', 'Соглашение API интеграции',
    'API partner uchun integratsiya shartlari',
    'Условия интеграции для API партнёра',
    E'# API Integration Agreement\n\n**1. Tomonlar:** Platforma va API Partner.\n\n**2. Xizmat:** REST API access, webhook events, rate limits.\n\n**3. Rate limits:** Tariffga muvofiq (Basic: 1k/kun, Pro: 10k/kun, Enterprise: cheksiz).\n\n**4. Xavfsizlik:** API key + HMAC signature majburiy.\n\n**5. Ma''lumotlardan foydalanish:** Faqat tasdiqlangan use-case lar uchun.\n\n**6. Liability:** Partner o''z foydalanuvchilari oldidagi javobgarlikni o''zi oladi.\n\n**7. Bekor qilish:** 30 kun oldin yozma ogohlantirish bilan.\n\n**8. Nizolar:** O''zR qonunchiligi.\n',
    E'# API Integration Agreement\n\n**1. Стороны:** Платформа и API Партнёр.\n\n**2. Услуга:** REST API, webhooks, rate limits.\n\n**3. Лимиты:** По тарифу (Basic 1k/день, Pro 10k, Enterprise — без огр.).\n\n**4. Безопасность:** API key + HMAC обязательны.\n\n**5. Использование данных:** Только утверждённые use-cases.\n\n**6. Ответственность:** Партнёр сам отвечает перед своими пользователями.\n\n**7. Расторжение:** Уведомление за 30 дней.\n\n**8. Споры:** Законы РУз.\n',
    'otp_canvas', ARRAY['vendor','admin'], true),

  ('ai', 'ai-services-terms',
    'AI Xizmatlar Foydalanish Shartlari', 'Условия использования AI сервисов',
    'AI moduli (14 ta) foydalanish shartlari',
    'Условия использования AI модулей (14 шт)',
    E'# AI Xizmatlar Foydalanish Shartlari\n\n**1. Tomonlar:** Platforma va Foydalanuvchi.\n\n**2. Xizmatlar:** AI Doctor Chat, Symptom Checker, Vital Signs, Pregnancy, Cosmetology, Pharmacology, va boshqalar (14 modul).\n\n**3. Eng MUHIM disclaimer:**\n> AI tahlillari faqat AXBOROT MAQSADIDA. Bu YAKUNIY TIBBIY TASHXIS EMAS. Aniq tashxis va davolanish uchun malakali shifokorga murojaat qiling.\n\n**4. Limitlar:** Tariffga muvofiq kunlik/oylik so''rovlar.\n\n**5. Ma''lumotlardan foydalanish:** Anonimizatsiya qilingan model takomillashtirish uchun ishlatiladi.\n\n**6. Liability:** Platforma AI javoblariga asoslangan qarorlar uchun javobgar emas.\n\n**7. Refund:** 14 kun.\n\n**8. Nizolar:** O''zR qonunchiligi.\n',
    E'# Условия использования AI сервисов\n\n**1. Стороны:** Платформа и Пользователь.\n\n**2. Услуги:** AI Doctor Chat, Symptom Checker, Vital Signs, и др. (14 модулей).\n\n**3. ВАЖНЫЙ дисклеймер:**\n> AI анализ — только ИНФОРМАТИВНО. Это НЕ окончательный диагноз. Обратитесь к врачу.\n\n**4. Лимиты:** Согласно тарифу.\n\n**5. Данные:** Анонимизированно используются для улучшения модели.\n\n**6. Ответственность:** Платформа не отвечает за решения на основе AI.\n\n**7. Возврат:** 14 дней.\n\n**8. Споры:** Законы РУз.\n',
    'otp_canvas', ARRAY['patient','doctor','clinic','admin'], true),

  ('saas', 'saas-subscription-agreement',
    'SaaS Obuna Shartnomasi', 'SaaS Подписка',
    'Platforma SaaS obunasi shartlari',
    'Условия SaaS подписки платформы',
    E'# SaaS Obuna Shartnomasi\n\n**1. Tomonlar:** MED-ALL AI SYSTEM MCHJ va Obunachi.\n\n**2. Xizmat:** Tanlangan moduldan foydalanish (Clinic/Dental/Diagnostics/...).\n\n**3. To''lov tarifi:** Free / Pro / Premium / Enterprise. Stripe yoki Click/Payme orqali.\n\n**4. Avtomatik yangilanish:** Obuna avtomatik yangilanadi — istalgan paytda bekor qilish mumkin.\n\n**5. Refund:** Birinchi 14 kun ichida 100%. Keyin proratsion.\n\n**6. SLA:** 99.5% uptime.\n\n**7. Ma''lumotlar eksporti:** Obuna tugagach 30 kun ichida to''liq eksport huquqi.\n\n**8. Liability cheklovi:** Maks. — 12 oylik obuna summasi.\n\n**9. Nizolar:** O''zR qonunchiligi.\n',
    E'# Договор SaaS подписки\n\n**1. Стороны:** MED-ALL AI SYSTEM ООО и Подписчик.\n\n**2. Услуга:** Использование выбранного модуля.\n\n**3. Тарифы:** Free / Pro / Premium / Enterprise.\n\n**4. Авто-продление:** Можно отменить в любой момент.\n\n**5. Возврат:** Первые 14 дней — 100%, далее — пропорционально.\n\n**6. SLA:** 99.5%.\n\n**7. Экспорт данных:** 30 дней после окончания.\n\n**8. Ограничение ответственности:** Макс. — годовая подписка.\n\n**9. Споры:** Законы РУз.\n',
    'otp_canvas', ARRAY['clinic','dental','diagnostics','maternity','pharmacy','doctor','admin'], true),

  ('referral', 'referral-promo-agreement',
    'Referral & Promo Dasturi Shartnomasi', 'Договор Реферальной программы',
    'Referral kodi va bonus qoidalari',
    'Правила реферального кода и бонусов',
    E'# Referral & Promo Shartnomasi\n\n**1. Dastur:** Har bir foydalanuvchi unikal kod oladi. Taklif qilingan kishi obuna bo''lganida bonus.\n\n**2. Bonuslar:** Credits, bonus oylar, AI credits — tariffga muvofiq.\n\n**3. Hold davri:** Refund himoyasi uchun bonus N kun hold ostida (admin sozlaydi).\n\n**4. Bekor qilish holatlari:**\n- Self-referral (o''zini taklif qilish) — bekor\n- Refund — bonus reverse qilinadi\n- Min. obuna summasi to''lanmasa — bekor\n- Vaqt limiti o''tib ketsa — expired\n\n**5. To''lov:** Bonuslar wallet ga qo''shiladi, naqd pulga aylantirilmaydi.\n\n**6. Suistemoldan himoya:** Anomaliya aniqlansa, bonus revoked.\n\n**7. Nizolar:** O''zR qonunchiligi.\n',
    E'# Реферальная программа\n\n**1. Программа:** Уникальный код. Бонус при подписке приглашённого.\n\n**2. Бонусы:** Credits, бонус-месяцы, AI credits.\n\n**3. Период удержания:** N дней для защиты от возвратов.\n\n**4. Отмена:**\n- Self-referral — отмена\n- Возврат — реверс бонуса\n- Мин. сумма не оплачена — отмена\n- Истёк срок — expired\n\n**5. Выплата:** Бонусы в кошелёк, не выводятся налом.\n\n**6. Анти-фрод:** При аномалии — revoke.\n\n**7. Споры:** Законы РУз.\n',
    'otp', ARRAY['patient','doctor','clinic','admin','dental','diagnostics','maternity','pharmacy','vendor'], true),

  ('patient', 'patient-portal-terms',
    'Bemor Portali Foydalanish Shartlari', 'Условия Портала пациента',
    'Bemor portali va telemedicine xizmatlari',
    'Портал пациента и телемедицина',
    E'# Bemor Portali Shartlari\n\n**1. Foydalanuvchi:** 18 yoshdan oshgan shaxs yoki vakili.\n\n**2. Xizmatlar:** Qabul yozish, telemedicine, EMR ko''rish, retsept, AI Health Assistant.\n\n**3. Tibbiy ogohlantirish:** AI tavsiyalari professional tashxis emas.\n\n**4. Maxfiylik:** Bemor ma''lumotlari faqat tegishli shifokorga ko''rinadi.\n\n**5. Telemedicine:** Jitsi Meet orqali, faqat to''langan vaqt davomida.\n\n**6. Liability:** Platforma tibbiy qarorlarga javobgar emas.\n\n**7. Nizolar:** O''zR qonunchiligi.\n',
    E'# Условия Портала пациента\n\n**1. Пользователь:** 18+ или представитель.\n\n**2. Услуги:** Запись, телемед, EMR, рецепты, AI Health Assistant.\n\n**3. Мед. дисклеймер:** AI — не диагноз.\n\n**4. Конфиденциальность:** Данные видны только лечащему врачу.\n\n**5. Телемедицина:** Через Jitsi Meet.\n\n**6. Ответственность:** Не отвечаем за мед. решения.\n\n**7. Споры:** Законы РУз.\n',
    'otp', ARRAY['patient','admin'], true),

  ('dpa', 'data-processing-agreement',
    'Ma''lumotlarni Qayta Ishlash Shartnomasi (DPA)', 'Соглашение об обработке данных (DPA)',
    'GDPR/HIPAA-style data processing agreement',
    'Соглашение об обработке данных в стиле GDPR/HIPAA',
    E'# Data Processing Agreement (DPA)\n\n**1. Tomonlar:** Data Controller (Klinika/Tashkilot) va Data Processor (Platforma).\n\n**2. Qayta ishlash maqsadi:** Faqat shartnomada belgilangan tibbiy xizmatlar uchun.\n\n**3. Ma''lumotlar turlari:** Bemor identifikatori, kontakt, tibbiy yozuvlar, lab natijalari, retseptlar.\n\n**4. Saqlash muddati:** Aktiv — obuna davomida; obuna tugagach 30 kun eksport, keyin o''chirish.\n\n**5. Sub-processors:** Stripe, Supabase, Lovable AI Gateway. Roziligi bilan yangilash.\n\n**6. Buzilish bildirish (Breach):** 72 soat ichida.\n\n**7. Foydalanuvchi huquqlari:** Ko''rish, tuzatish, o''chirish, eksport.\n\n**8. Texnik chora-tadbirlar:** AES-256 encryption at rest, TLS in transit, RLS, audit logs.\n\n**9. Nizolar:** O''zR qonunchiligi.\n',
    E'# Соглашение об обработке данных (DPA)\n\n**1. Стороны:** Контроллер (Клиника) и Обработчик (Платформа).\n\n**2. Цель:** Только согласованные мед. услуги.\n\n**3. Типы данных:** ID, контакты, мед. записи, лаб. результаты, рецепты.\n\n**4. Срок хранения:** Период подписки + 30 дней.\n\n**5. Суб-обработчики:** Stripe, Supabase, Lovable AI Gateway.\n\n**6. Уведомление о нарушении:** 72 часа.\n\n**7. Права пользователя:** Просмотр, исправление, удаление, экспорт.\n\n**8. Техн. меры:** AES-256, TLS, RLS, audit logs.\n\n**9. Споры:** Законы РУз.\n',
    'otp_canvas', ARRAY['clinic','dental','diagnostics','maternity','pharmacy','admin'], true),

  ('privacy', 'privacy-policy-contract',
    'Maxfiylik Siyosati', 'Политика конфиденциальности',
    'Platforma maxfiylik siyosati',
    'Политика конфиденциальности платформы',
    E'# Maxfiylik Siyosati\n\n**1. Yig''iladigan ma''lumotlar:** Email, telefon, FIO, foydalanish statistikasi.\n\n**2. Foydalanish maqsadi:** Xizmat ko''rsatish, xavfsizlik, statistika.\n\n**3. Uchinchi tomonlar:** Faqat zaruriy infrastructure (Supabase, Stripe).\n\n**4. Cookies:** Auth va analytics uchun.\n\n**5. Huquqlar:** Ma''lumotni o''chirish so''rovi har doim qabul qilinadi.\n\n**6. Bog''lanish:** support@med1.uz\n\n**7. Nizolar:** O''zR qonunchiligi.\n',
    E'# Политика конфиденциальности\n\n**1. Собираемые данные:** Email, телефон, ФИО, статистика.\n\n**2. Цель:** Услуги, безопасность.\n\n**3. Третьи лица:** Только инфраструктура.\n\n**4. Cookies:** Auth и аналитика.\n\n**5. Права:** Запрос удаления принимается всегда.\n\n**6. Контакт:** support@med1.uz\n\n**7. Споры:** Законы РУз.\n',
    'checkbox', ARRAY['patient','doctor','clinic','admin','dental','diagnostics','maternity','pharmacy','vendor','bloodbank','cosmetology'], true),

  ('compliance', 'hipaa-gdpr-compliance',
    'HIPAA / GDPR Compliance Statement', 'HIPAA / GDPR Соответствие',
    'Compliance bo''yicha rasmiy bayonot',
    'Официальное заявление о соответствии',
    E'# HIPAA / GDPR Compliance Statement\n\n**1. HIPAA-style PHI himoyasi:** Tibbiy ma''lumotlar to''liq shifrlangan, kirish faqat tasdiqlangan rollarga.\n\n**2. GDPR principles:** Lawful basis, data minimization, purpose limitation, accuracy, storage limitation, integrity, accountability.\n\n**3. DPO (Data Protection Officer):** privacy@med1.uz\n\n**4. Audit logs:** Barcha kirish va o''zgartirishlar log qilinadi.\n\n**5. Encryption:** AES-256 at rest, TLS 1.3 in transit.\n\n**6. Foydalanuvchi huquqlari (GDPR Art. 15-22):** Access, Rectification, Erasure, Portability, Objection.\n\n**7. Breach notification:** 72 soat ichida.\n\n**8. Nizolar:** O''zR qonunchiligi.\n',
    E'# Заявление о соответствии HIPAA / GDPR\n\n**1. Защита PHI:** Полное шифрование, доступ по ролям.\n\n**2. GDPR принципы:** Законность, минимизация, точность, целостность.\n\n**3. DPO:** privacy@med1.uz\n\n**4. Audit logs:** Логируем доступ и изменения.\n\n**5. Шифрование:** AES-256, TLS 1.3.\n\n**6. Права (GDPR ст. 15-22):** Доступ, исправление, удаление, портативность.\n\n**7. Уведомление:** 72 часа.\n\n**8. Споры:** Законы РУз.\n',
    'otp_canvas', ARRAY['clinic','dental','diagnostics','maternity','pharmacy','admin'], false),

  ('ai-disclaimer', 'ai-disclaimer-agreement',
    'AI Disclaimer Shartnomasi', 'AI Дисклеймер',
    'AI xizmatlari uchun majburiy ogohlantirish',
    'Обязательное предупреждение для AI сервисов',
    E'# AI Disclaimer Shartnomasi\n\n## MUHIM OGOHLANTIRISH\n\nUshbu platformaning sun''iy intellekt (AI) tahlillari va tavsiyalari **FAQAT AXBOROT MAQSADIDA** taqdim etiladi va **YAKUNIY TIBBIY TASHXIS HISOBLANMAYDI**.\n\n**1. AI ning chegaralari:**\n- AI xato qilishi mumkin\n- Har bir bemorning holati noyob\n- AI lab natijalarini noto''g''ri talqin qilishi mumkin\n- AI shoshilinch tibbiy holatni aniqlay olmasligi mumkin\n\n**2. Foydalanuvchining roziligi:**\nMen tushunamanki:\n- AI tavsiyalari shifokor maslahatini almashtirmaydi\n- Aniq tashxis uchun malakali shifokorga murojaat qilishim kerak\n- Shoshilinch holatlarda 103 ga qo''ng''iroq qilaman\n- AI ma''lumotlariga to''la ishonib, davolanish qarorlarini o''zim qabul qilmayman\n\n**3. Liability:** MED-ALL AI SYSTEM MCHJ AI tavsiyalariga asoslangan tibbiy qarorlar uchun **HECH QANDAY JAVOBGARLIK KO''TARMAYDI**.\n\n**4. Shoshilinch holatlar:** 103 (Tez yordam) yoki yaqin atrofdagi shifokorxonaga murojaat qiling.\n\n**5. Nizolar:** O''zR qonunchiligi.\n',
    E'# AI Дисклеймер\n\n## ВАЖНОЕ ПРЕДУПРЕЖДЕНИЕ\n\nAI-анализы и рекомендации **ТОЛЬКО ИНФОРМАТИВНО** и **НЕ ЯВЛЯЮТСЯ ОКОНЧАТЕЛЬНЫМ ДИАГНОЗОМ**.\n\n**1. Ограничения AI:**\n- AI может ошибаться\n- Каждый пациент уникален\n- AI может неправильно интерпретировать результаты\n- AI может не распознать неотложное состояние\n\n**2. Согласие:**\nЯ понимаю, что:\n- AI не заменяет врача\n- Для диагноза обращусь к специалисту\n- В экстренных случаях — 103\n- Не принимаю решения только на основе AI\n\n**3. Ответственность:** MED-ALL AI SYSTEM ООО **НЕ НЕСЁТ ОТВЕТСТВЕННОСТИ** за решения на основе AI.\n\n**4. Экстренно:** 103 или ближайшая больница.\n\n**5. Споры:** Законы РУз.\n',
    'otp', ARRAY['patient','doctor','clinic','admin','dental','diagnostics','maternity','pharmacy','vendor','bloodbank','cosmetology'], true)
) AS t(slug_cat, slug, title_uz, title_ru, summary_uz, summary_ru, body_uz, body_ru, req_sig, roles, mandatory)
ON cats.slug = t.slug_cat
ON CONFLICT (slug) DO NOTHING;

-- Seed initial template versions snapshot
INSERT INTO public.contract_template_versions (template_id, version, title_uz, title_ru, body_uz, body_ru, change_notes)
SELECT id, current_version, title_uz, title_ru, body_uz, body_ru, 'Initial release'
FROM public.contract_templates
ON CONFLICT (template_id, version) DO NOTHING;
