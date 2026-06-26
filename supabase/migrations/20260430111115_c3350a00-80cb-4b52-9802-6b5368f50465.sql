
-- ============== SETTINGS ==============
CREATE TABLE IF NOT EXISTS public.diagnostics_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  center_id UUID NOT NULL UNIQUE REFERENCES public.registered_diagnostics(id) ON DELETE CASCADE,
  display_name TEXT,
  logo_url TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  working_hours JSONB DEFAULT '{"mon":"08:00-18:00","tue":"08:00-18:00","wed":"08:00-18:00","thu":"08:00-18:00","fri":"08:00-18:00","sat":"09:00-14:00","sun":"closed"}'::jsonb,
  language TEXT DEFAULT 'uz',
  timezone TEXT DEFAULT 'Asia/Tashkent',
  date_format TEXT DEFAULT 'DD.MM.YYYY',
  currency TEXT DEFAULT 'UZS',
  lab_settings JSONB DEFAULT '{"default_unit_system":"SI","auto_apply_template":true,"smart_autofill":true}'::jsonb,
  radiology_settings JSONB DEFAULT '{"allowed_formats":["JPG","PNG","DICOM","PDF"],"max_file_mb":50,"viewer":"standard"}'::jsonb,
  report_settings JSONB DEFAULT '{"show_logo":true,"show_signature":true,"show_qr":true,"footer_text":""}'::jsonb,
  payment_settings JSONB DEFAULT '{"click_enabled":false,"payme_enabled":false,"cash_enabled":true,"card_enabled":true,"click_merchant_id":"","payme_merchant_id":""}'::jsonb,
  notification_settings JSONB DEFAULT '{"sms":false,"telegram":true,"email":true,"on_result_ready":true,"on_appointment":true}'::jsonb,
  security_settings JSONB DEFAULT '{"require_2fa":false,"password_min_length":8,"max_login_attempts":5,"lockout_minutes":10}'::jsonb,
  ai_settings JSONB DEFAULT '{"enabled":true,"daily_limit":100,"model":"google/gemini-1.5-flash"}'::jsonb,
  file_settings JSONB DEFAULT '{"max_image_mb":10,"max_pdf_mb":20,"allowed_types":["jpg","png","pdf","dcm"]}'::jsonb,
  service_settings JSONB DEFAULT '{"default_duration_min":30,"auto_invoice":true}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.diagnostics_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owner manages settings" ON public.diagnostics_settings;
CREATE POLICY "Owner manages settings" ON public.diagnostics_settings
FOR ALL USING (
  center_id IN (SELECT id FROM public.registered_diagnostics WHERE owner_id = auth.uid())
) WITH CHECK (
  center_id IN (SELECT id FROM public.registered_diagnostics WHERE owner_id = auth.uid())
);

DROP TRIGGER IF EXISTS trg_diag_settings_updated ON public.diagnostics_settings;
CREATE TRIGGER trg_diag_settings_updated
BEFORE UPDATE ON public.diagnostics_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============== APPOINTMENTS — extend existing ==============
ALTER TABLE public.diagnostics_appointments
  ADD COLUMN IF NOT EXISTS service_name TEXT,
  ADD COLUMN IF NOT EXISTS staff_id UUID,
  ADD COLUMN IF NOT EXISTS staff_name TEXT,
  ADD COLUMN IF NOT EXISTS duration_min INT DEFAULT 30,
  ADD COLUMN IF NOT EXISTS appt_source TEXT DEFAULT 'internal',
  ADD COLUMN IF NOT EXISTS referral_id UUID,
  ADD COLUMN IF NOT EXISTS order_id UUID,
  ADD COLUMN IF NOT EXISTS created_by UUID;

CREATE INDEX IF NOT EXISTS idx_diag_appt_center_date ON public.diagnostics_appointments(center_id, appointment_date);
CREATE INDEX IF NOT EXISTS idx_diag_appt_status ON public.diagnostics_appointments(status);

DROP POLICY IF EXISTS "Public can create online booking" ON public.diagnostics_appointments;
CREATE POLICY "Public can create online booking" ON public.diagnostics_appointments
FOR INSERT TO anon, authenticated
WITH CHECK (appt_source = 'online');

-- ============== REFERRALS ==============
CREATE TABLE IF NOT EXISTS public.diagnostics_referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  center_id UUID NOT NULL REFERENCES public.registered_diagnostics(id) ON DELETE CASCADE,
  direction TEXT NOT NULL CHECK (direction IN ('inbound','outbound')),
  patient_id UUID,
  patient_name TEXT NOT NULL,
  patient_phone TEXT,
  from_doctor_name TEXT,
  from_clinic_name TEXT,
  to_service_id UUID,
  to_service_name TEXT,
  to_doctor_name TEXT,
  reason TEXT,
  diagnosis TEXT,
  icd10_code TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','accepted','completed','rejected','cancelled')),
  appointment_id UUID,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_diag_ref_center ON public.diagnostics_referrals(center_id);
CREATE INDEX IF NOT EXISTS idx_diag_ref_status ON public.diagnostics_referrals(status);

ALTER TABLE public.diagnostics_referrals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Center staff manage referrals" ON public.diagnostics_referrals;
CREATE POLICY "Center staff manage referrals" ON public.diagnostics_referrals
FOR ALL USING (
  center_id IN (SELECT id FROM public.registered_diagnostics WHERE owner_id = auth.uid())
) WITH CHECK (
  center_id IN (SELECT id FROM public.registered_diagnostics WHERE owner_id = auth.uid())
);

DROP POLICY IF EXISTS "Patient sees own referrals" ON public.diagnostics_referrals;
CREATE POLICY "Patient sees own referrals" ON public.diagnostics_referrals
FOR SELECT USING (patient_id = auth.uid());

DROP TRIGGER IF EXISTS trg_diag_ref_updated ON public.diagnostics_referrals;
CREATE TRIGGER trg_diag_ref_updated
BEFORE UPDATE ON public.diagnostics_referrals
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============== PRESET TEMPLATES ==============
ALTER TABLE public.diagnostics_test_templates 
  ADD COLUMN IF NOT EXISTS is_preset BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS preset_key TEXT;

CREATE TABLE IF NOT EXISTS public.diagnostics_preset_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  preset_key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  parameters JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.diagnostics_preset_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read presets" ON public.diagnostics_preset_templates;
CREATE POLICY "Anyone can read presets" ON public.diagnostics_preset_templates
FOR SELECT TO anon, authenticated USING (true);

INSERT INTO public.diagnostics_preset_templates (preset_key, name, category, description, parameters) VALUES
('cbc', 'Umumiy qon analizi (UMA)', 'Hematology', 'Complete Blood Count', '[{"name":"Hemoglobin","unit":"g/L","min":120,"max":160,"avg":140},{"name":"Eritrotsit (RBC)","unit":"x10^12/L","min":4.0,"max":5.5,"avg":4.7},{"name":"Leykotsit (WBC)","unit":"x10^9/L","min":4.0,"max":10.0,"avg":7.0},{"name":"Trombotsit (PLT)","unit":"x10^9/L","min":150,"max":400,"avg":275},{"name":"Gematokrit (HCT)","unit":"%","min":36,"max":48,"avg":42},{"name":"MCV","unit":"fL","min":80,"max":100,"avg":90},{"name":"MCH","unit":"pg","min":27,"max":33,"avg":30},{"name":"MCHC","unit":"g/dL","min":32,"max":36,"avg":34},{"name":"ECHT (SOE)","unit":"mm/h","min":2,"max":15,"avg":8},{"name":"Limfotsit","unit":"%","min":20,"max":40,"avg":30}]'::jsonb),
('biochem_basic', 'Biokimyoviy analiz (asosiy)', 'Biochemistry', 'Glukoza, kreatinin, jigar', '[{"name":"Glukoza","unit":"mmol/L","min":3.5,"max":5.5,"avg":4.5},{"name":"Kreatinin","unit":"umol/L","min":62,"max":115,"avg":88},{"name":"Mochevina","unit":"mmol/L","min":2.5,"max":7.5,"avg":5.0},{"name":"Umumiy bilirubin","unit":"umol/L","min":3.4,"max":17.1,"avg":10},{"name":"Togri bilirubin","unit":"umol/L","min":0,"max":3.4,"avg":2},{"name":"ALT","unit":"U/L","min":7,"max":40,"avg":24},{"name":"AST","unit":"U/L","min":10,"max":40,"avg":25},{"name":"Umumiy oqsil","unit":"g/L","min":65,"max":85,"avg":75},{"name":"Albumin","unit":"g/L","min":35,"max":52,"avg":43},{"name":"Ishqoriy fosfataza","unit":"U/L","min":40,"max":150,"avg":95}]'::jsonb),
('lipid', 'Lipidogramma', 'Biochemistry', 'Xolesterin profili', '[{"name":"Umumiy xolesterin","unit":"mmol/L","min":3.0,"max":5.2,"avg":4.5},{"name":"LDL","unit":"mmol/L","min":1.5,"max":3.5,"avg":2.5},{"name":"HDL","unit":"mmol/L","min":1.0,"max":2.2,"avg":1.5},{"name":"Triglitseridlar","unit":"mmol/L","min":0.5,"max":1.7,"avg":1.0},{"name":"Atherogen koeffitsient","unit":"","min":2.0,"max":3.0,"avg":2.5}]'::jsonb),
('coagulation', 'Koagulogramma', 'Hematology', 'Qon ivish profili', '[{"name":"PTI","unit":"%","min":80,"max":120,"avg":100},{"name":"INR","unit":"","min":0.85,"max":1.15,"avg":1.0},{"name":"APTT","unit":"sek","min":25,"max":35,"avg":30},{"name":"Fibrinogen","unit":"g/L","min":2.0,"max":4.0,"avg":3.0},{"name":"D-dimer","unit":"ng/mL","min":0,"max":500,"avg":200}]'::jsonb),
('thyroid', 'Qalqonsimon bez gormonlari', 'Hormones', 'TTG, T3, T4', '[{"name":"TTG (TSH)","unit":"mIU/L","min":0.4,"max":4.0,"avg":2.0},{"name":"Free T4","unit":"pmol/L","min":9,"max":22,"avg":15},{"name":"Free T3","unit":"pmol/L","min":3.1,"max":6.8,"avg":5.0},{"name":"Anti-TPO","unit":"IU/mL","min":0,"max":34,"avg":15},{"name":"Anti-TG","unit":"IU/mL","min":0,"max":115,"avg":40}]'::jsonb),
('reproductive_f', 'Reproduktiv gormonlar (ayollar)', 'Hormones', 'FSH, LH, Estradiol, Progesteron', '[{"name":"FSH","unit":"mIU/mL","min":3.5,"max":12.5,"avg":7},{"name":"LH","unit":"mIU/mL","min":2.4,"max":12.6,"avg":7},{"name":"Estradiol","unit":"pmol/L","min":110,"max":440,"avg":250},{"name":"Progesteron","unit":"nmol/L","min":1.0,"max":89,"avg":30},{"name":"Prolaktin","unit":"ng/mL","min":4.8,"max":23.3,"avg":14}]'::jsonb),
('reproductive_m', 'Reproduktiv gormonlar (erkaklar)', 'Hormones', 'Testosteron, FSH, LH', '[{"name":"Umumiy testosteron","unit":"nmol/L","min":8.6,"max":29,"avg":18},{"name":"Free testosteron","unit":"pg/mL","min":47,"max":244,"avg":140},{"name":"FSH","unit":"mIU/mL","min":1.4,"max":18.1,"avg":7},{"name":"LH","unit":"mIU/mL","min":1.5,"max":9.3,"avg":5},{"name":"Prolaktin","unit":"ng/mL","min":3.0,"max":14.7,"avg":9}]'::jsonb),
('urine_general', 'Umumiy siydik analizi', 'Urology', 'OAM', '[{"name":"Rang","unit":"","min":0,"max":0,"avg":0},{"name":"Tiniqlik","unit":"","min":0,"max":0,"avg":0},{"name":"pH","unit":"","min":5.0,"max":7.5,"avg":6.0},{"name":"Oqsil","unit":"g/L","min":0,"max":0.1,"avg":0},{"name":"Glukoza","unit":"mmol/L","min":0,"max":0.8,"avg":0},{"name":"Leykotsit","unit":"hpf","min":0,"max":5,"avg":2},{"name":"Eritrotsit","unit":"hpf","min":0,"max":2,"avg":0},{"name":"Solishtirma ogirlik","unit":"","min":1.010,"max":1.030,"avg":1.020}]'::jsonb),
('hba1c', 'Glikollangan gemoglobin (HbA1c)', 'Biochemistry', 'Diabet skrining', '[{"name":"HbA1c","unit":"%","min":4.0,"max":5.6,"avg":5.2},{"name":"Ortacha glukoza","unit":"mmol/L","min":3.9,"max":7.0,"avg":5.4}]'::jsonb),
('electrolytes', 'Elektrolitlar', 'Biochemistry', 'Na, K, Ca, Mg, Cl', '[{"name":"Natriy (Na)","unit":"mmol/L","min":135,"max":145,"avg":140},{"name":"Kaliy (K)","unit":"mmol/L","min":3.5,"max":5.0,"avg":4.2},{"name":"Kalsiy (Ca)","unit":"mmol/L","min":2.15,"max":2.55,"avg":2.35},{"name":"Magniy (Mg)","unit":"mmol/L","min":0.7,"max":1.05,"avg":0.85},{"name":"Xlor (Cl)","unit":"mmol/L","min":98,"max":107,"avg":102}]'::jsonb),
('iron', 'Temir almashuvi', 'Biochemistry', 'Fe, Ferritin, Transferrin', '[{"name":"Temir (Fe)","unit":"umol/L","min":9,"max":30,"avg":18},{"name":"Ferritin","unit":"ng/mL","min":15,"max":150,"avg":80},{"name":"Transferrin","unit":"g/L","min":2.0,"max":3.6,"avg":2.8},{"name":"TIBC","unit":"umol/L","min":45,"max":75,"avg":60}]'::jsonb),
('vitamins', 'Vitaminlar (D, B12, Folat)', 'Biochemistry', 'Asosiy vitaminlar', '[{"name":"Vitamin D (25-OH)","unit":"ng/mL","min":30,"max":100,"avg":50},{"name":"Vitamin B12","unit":"pg/mL","min":200,"max":900,"avg":500},{"name":"Folat","unit":"ng/mL","min":3,"max":17,"avg":10}]'::jsonb),
('crp', 'CRP (C-reaktiv oqsil)', 'Inflammation', 'Yalliglanish markeri', '[{"name":"CRP","unit":"mg/L","min":0,"max":5,"avg":2}]'::jsonb),
('procalcitonin', 'Prokalsitonin', 'Inflammation', 'Sepsis markeri', '[{"name":"PCT","unit":"ng/mL","min":0,"max":0.5,"avg":0.1}]'::jsonb),
('hep_panel', 'Gepatit paneli', 'Serology', 'HBsAg, Anti-HCV, HIV', '[{"name":"HBsAg","unit":"S/CO","min":0,"max":1,"avg":0},{"name":"Anti-HCV","unit":"S/CO","min":0,"max":1,"avg":0},{"name":"Anti-HIV","unit":"S/CO","min":0,"max":1,"avg":0},{"name":"RW (sifilis)","unit":"","min":0,"max":0,"avg":0}]'::jsonb),
('tumor_markers_f', 'Onkomarkerlar (ayollar)', 'Oncology', 'CA-125, CA-15-3, CEA', '[{"name":"CA-125","unit":"U/mL","min":0,"max":35,"avg":15},{"name":"CA-15-3","unit":"U/mL","min":0,"max":30,"avg":12},{"name":"CEA","unit":"ng/mL","min":0,"max":5,"avg":2},{"name":"AFP","unit":"ng/mL","min":0,"max":10,"avg":3}]'::jsonb),
('tumor_markers_m', 'Onkomarkerlar (erkaklar)', 'Oncology', 'PSA, CEA, AFP', '[{"name":"PSA umumiy","unit":"ng/mL","min":0,"max":4,"avg":1.5},{"name":"PSA free","unit":"ng/mL","min":0,"max":1,"avg":0.4},{"name":"CEA","unit":"ng/mL","min":0,"max":5,"avg":2},{"name":"AFP","unit":"ng/mL","min":0,"max":10,"avg":3}]'::jsonb),
('cortisol', 'Kortizol va ACTH', 'Hormones', 'Buyrak usti gormonlari', '[{"name":"Kortizol (ertalab)","unit":"nmol/L","min":171,"max":536,"avg":350},{"name":"ACTH","unit":"pg/mL","min":7.2,"max":63.3,"avg":30}]'::jsonb),
('insulin', 'Insulin va C-peptid', 'Hormones', 'Diabet diagnostikasi', '[{"name":"Insulin (ochlikda)","unit":"uU/mL","min":2.6,"max":24.9,"avg":12},{"name":"C-peptid","unit":"ng/mL","min":1.1,"max":4.4,"avg":2.5},{"name":"HOMA-IR","unit":"","min":0,"max":2.7,"avg":1.5}]'::jsonb),
('xray', 'Rentgen tekshiruvi', 'Radiology', 'X-Ray xulosa shabloni', '[{"name":"Tekshiruv turi","unit":"","min":0,"max":0,"avg":0},{"name":"Suyak strukturasi","unit":"","min":0,"max":0,"avg":0},{"name":"Yumshoq toqimalar","unit":"","min":0,"max":0,"avg":0},{"name":"Patologik ozgarishlar","unit":"","min":0,"max":0,"avg":0},{"name":"Xulosa","unit":"","min":0,"max":0,"avg":0}]'::jsonb),
('ultrasound', 'UZI tekshiruvi', 'Radiology', 'Ultratovush xulosa', '[{"name":"Tekshiruv sohasi","unit":"","min":0,"max":0,"avg":0},{"name":"Olchamlar","unit":"mm","min":0,"max":0,"avg":0},{"name":"Exogenlik","unit":"","min":0,"max":0,"avg":0},{"name":"Strukturasi","unit":"","min":0,"max":0,"avg":0},{"name":"Xulosa","unit":"","min":0,"max":0,"avg":0}]'::jsonb),
('ecg', 'EKG tekshiruvi', 'Functional', 'Elektrokardiogramma', '[{"name":"Ritm","unit":"","min":0,"max":0,"avg":0},{"name":"Yurak qisqarishlar soni","unit":"bpm","min":60,"max":100,"avg":75},{"name":"PQ intervali","unit":"sek","min":0.12,"max":0.20,"avg":0.16},{"name":"QRS kompleks","unit":"sek","min":0.06,"max":0.10,"avg":0.08},{"name":"QT intervali","unit":"sek","min":0.36,"max":0.44,"avg":0.40},{"name":"Xulosa","unit":"","min":0,"max":0,"avg":0}]'::jsonb)
ON CONFLICT (preset_key) DO NOTHING;
