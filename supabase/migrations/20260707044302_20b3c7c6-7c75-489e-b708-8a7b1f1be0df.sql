
-- ============ api_endpoints ============
CREATE TABLE public.api_endpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  path TEXT NOT NULL,
  method TEXT NOT NULL CHECK (method IN ('GET','POST','PUT','PATCH','DELETE')),
  category TEXT NOT NULL CHECK (category IN ('mobile','web','hambi','partner','ai','auth','user','clinics','appointments','emr','payments','notifications','maps','webhook')),
  scope TEXT NOT NULL DEFAULT '*',
  title TEXT NOT NULL,
  description TEXT,
  request_schema JSONB DEFAULT '{}'::jsonb,
  response_schema JSONB DEFAULT '{}'::jsonb,
  is_deprecated BOOLEAN NOT NULL DEFAULT false,
  is_public BOOLEAN NOT NULL DEFAULT false,
  rate_limit_per_min INT,
  rate_limit_per_day INT,
  version TEXT NOT NULL DEFAULT 'v1',
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(method, path, version)
);
CREATE INDEX idx_api_endpoints_category ON public.api_endpoints(category);
GRANT SELECT ON public.api_endpoints TO anon, authenticated;
GRANT ALL ON public.api_endpoints TO service_role;
ALTER TABLE public.api_endpoints ENABLE ROW LEVEL SECURITY;
CREATE POLICY "endpoints readable by all" ON public.api_endpoints FOR SELECT USING (true);
CREATE POLICY "admins manage endpoints" ON public.api_endpoints FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_api_endpoints_updated BEFORE UPDATE ON public.api_endpoints
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============ api_oauth_clients ============
CREATE TABLE public.api_oauth_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID REFERENCES public.api_partners(id) ON DELETE CASCADE,
  client_id TEXT NOT NULL UNIQUE,
  client_secret_hash TEXT NOT NULL,
  client_name TEXT NOT NULL,
  redirect_uris TEXT[] NOT NULL DEFAULT '{}',
  allowed_grants TEXT[] NOT NULL DEFAULT '{authorization_code,refresh_token}',
  scopes TEXT[] NOT NULL DEFAULT '{}',
  is_confidential BOOLEAN NOT NULL DEFAULT true,
  is_active BOOLEAN NOT NULL DEFAULT true,
  access_token_ttl_seconds INT NOT NULL DEFAULT 3600,
  refresh_token_ttl_seconds INT NOT NULL DEFAULT 2592000,
  last_used_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_oauth_clients_partner ON public.api_oauth_clients(partner_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.api_oauth_clients TO authenticated;
GRANT ALL ON public.api_oauth_clients TO service_role;
ALTER TABLE public.api_oauth_clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins manage oauth clients" ON public.api_oauth_clients FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_oauth_clients_updated BEFORE UPDATE ON public.api_oauth_clients
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============ api_sdk_versions ============
CREATE TABLE public.api_sdk_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  language TEXT NOT NULL CHECK (language IN ('flutter','dart','javascript','typescript','kotlin','swift','react-native','python','nodejs','php','laravel','curl')),
  version TEXT NOT NULL,
  download_url TEXT,
  repository_url TEXT,
  changelog TEXT,
  is_latest BOOLEAN NOT NULL DEFAULT false,
  is_stable BOOLEAN NOT NULL DEFAULT true,
  min_api_version TEXT NOT NULL DEFAULT 'v1',
  released_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(language, version)
);
GRANT SELECT ON public.api_sdk_versions TO anon, authenticated;
GRANT ALL ON public.api_sdk_versions TO service_role;
ALTER TABLE public.api_sdk_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sdks readable by all" ON public.api_sdk_versions FOR SELECT USING (true);
CREATE POLICY "admins manage sdks" ON public.api_sdk_versions FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_sdk_versions_updated BEFORE UPDATE ON public.api_sdk_versions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============ api_monitoring_alerts ============
CREATE TABLE public.api_monitoring_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  metric TEXT NOT NULL CHECK (metric IN ('error_rate','latency_p95','request_volume','rate_limit_hits','auth_failures')),
  operator TEXT NOT NULL DEFAULT '>' CHECK (operator IN ('>','<','>=','<=','==')),
  threshold NUMERIC NOT NULL,
  window_minutes INT NOT NULL DEFAULT 5,
  scope_endpoint TEXT,
  scope_partner_id UUID REFERENCES public.api_partners(id) ON DELETE CASCADE,
  notify_email TEXT,
  notify_telegram_chat_id TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_triggered_at TIMESTAMPTZ,
  trigger_count INT NOT NULL DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.api_monitoring_alerts TO authenticated;
GRANT ALL ON public.api_monitoring_alerts TO service_role;
ALTER TABLE public.api_monitoring_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins manage alerts" ON public.api_monitoring_alerts FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_monitoring_alerts_updated BEFORE UPDATE ON public.api_monitoring_alerts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============ Seed endpoint catalog (Mobile API v1) ============
INSERT INTO public.api_endpoints(path, method, category, scope, title, description, is_public) VALUES
  ('/v1/ping','GET','mobile','*','Health check','API tirikligini tekshirish',true),
  -- Auth
  ('/v1/auth/login','POST','auth','*','Login','Email/telefon + parol orqali kirish',true),
  ('/v1/auth/register','POST','auth','*','Register','Yangi foydalanuvchi ro''yxatdan o''tish',true),
  ('/v1/auth/otp/send','POST','auth','*','Send OTP','SMS/Telegram OTP yuborish',true),
  ('/v1/auth/otp/verify','POST','auth','*','Verify OTP','OTP kodni tasdiqlash',true),
  ('/v1/auth/refresh','POST','auth','*','Refresh token','JWT tokenni yangilash',true),
  ('/v1/auth/logout','POST','auth','user:read','Logout','Sessiyani tugatish',false),
  ('/v1/auth/forgot-password','POST','auth','*','Forgot password','Parolni tiklash uchun link yuborish',true),
  -- User
  ('/v1/user/profile','GET','user','user:read','Get profile','Foydalanuvchi profilini olish',false),
  ('/v1/user/profile','PATCH','user','user:write','Update profile','Profilni tahrirlash',false),
  ('/v1/user/avatar','POST','user','user:write','Upload avatar','Avatar rasmini yuklash',false),
  ('/v1/user/settings','PATCH','user','user:write','Update settings','Til va sozlamalarni o''zgartirish',false),
  -- AI (14 services)
  ('/v1/ai/doctor','POST','ai','ai:chat','AI Doctor','Umumiy tibbiy maslahat',false),
  ('/v1/ai/symptoms','POST','ai','ai:chat','AI Symptoms','Symptom checker',false),
  ('/v1/ai/laboratory','POST','ai','ai:chat','AI Laboratory','Laboratoriya natijalarini tahlil',false),
  ('/v1/ai/radiology','POST','ai','ai:chat','AI Radiology','Radiologik tasvir tahlili',false),
  ('/v1/ai/pregnancy','POST','ai','ai:chat','AI Pregnancy','Homiladorlik maslahatchisi',false),
  ('/v1/ai/baby-care','POST','ai','ai:chat','AI Baby Care','Chaqaloq parvarishi',false),
  ('/v1/ai/psychologist','POST','ai','ai:chat','AI Psychologist','Psixolog',false),
  ('/v1/ai/diet','POST','ai','ai:chat','AI Diet','Dietolog',false),
  ('/v1/ai/pharmacy','POST','ai','ai:chat','AI Pharmacy','Farmatsevt',false),
  ('/v1/ai/cosmetology','POST','ai','ai:chat','AI Cosmetology','Kosmetolog',false),
  ('/v1/ai/fitness','POST','ai','ai:chat','AI Fitness','Fitness murabbiy',false),
  ('/v1/ai/assistant','POST','ai','ai:chat','AI Medical Assistant','Umumiy tibbiy yordamchi',false),
  ('/v1/ai/monitoring','POST','ai','ai:chat','AI Health Monitoring','Salomatlik monitoringi',false),
  ('/v1/ai/prediction','POST','ai','ai:chat','AI Disease Prediction','Kasallik ehtimolini bashorat qilish',false),
  -- Clinics/Doctors/Diagnostics/Maternity/Pharmacy
  ('/v1/clinics','GET','clinics','clinic:read','List clinics','Klinikalar ro''yxati',true),
  ('/v1/clinics/{id}','GET','clinics','clinic:read','Get clinic','Bitta klinika ma''lumoti',true),
  ('/v1/doctors','GET','clinics','doctor:read','List doctors','Shifokorlar ro''yxati',true),
  ('/v1/doctors/{id}','GET','clinics','doctor:read','Get doctor','Bitta shifokor',true),
  ('/v1/diagnostics','GET','clinics','diagnostics:read','List diagnostics','Diagnostika markazlari',true),
  ('/v1/maternity','GET','clinics','clinic:read','List maternity','Tug''ruqxonalar',true),
  ('/v1/pharmacies','GET','clinics','pharmacy:read','List pharmacies','Dorixonalar',true),
  -- Appointments
  ('/v1/appointments','POST','appointments','booking:write','Create appointment','Qabul yaratish',false),
  ('/v1/appointments/{id}','DELETE','appointments','booking:write','Cancel appointment','Qabulni bekor qilish',false),
  ('/v1/appointments/history','GET','appointments','booking:read','History','Qabullar tarixi',false),
  ('/v1/appointments/{id}/checkin','POST','appointments','booking:write','QR check-in','QR orqali kelganini tasdiqlash',false),
  -- EMR
  ('/v1/emr/records','GET','emr','emr:read','Medical records','Tibbiy karta',false),
  ('/v1/emr/analyses','GET','emr','emr:read','Lab analyses','Analiz natijalari',false),
  ('/v1/emr/prescriptions','GET','emr','emr:read','Prescriptions','Retseptlar',false),
  ('/v1/emr/diagnoses','GET','emr','emr:read','Diagnoses','Tashxislar',false),
  -- Payments
  ('/v1/payments/click','POST','payments','payment:write','Click payment','Click orqali to''lov',false),
  ('/v1/payments/payme','POST','payments','payment:write','Payme payment','Payme orqali to''lov',false),
  ('/v1/payments/uzum','POST','payments','payment:write','Uzum payment','Uzum orqali to''lov',false),
  ('/v1/payments/history','GET','payments','payment:read','Payment history','To''lovlar tarixi',false),
  ('/v1/subscriptions','GET','payments','payment:read','Subscriptions','Obunalar',false),
  ('/v1/med-coin/purchase','POST','payments','payment:write','Buy Med Coin','Med Coin sotib olish',false),
  -- Notifications
  ('/v1/notifications/push','POST','notifications','notify:write','Send push','Push notification',false),
  ('/v1/notifications/sms','POST','notifications','notify:write','Send SMS','SMS yuborish',false),
  ('/v1/notifications/email','POST','notifications','notify:write','Send email','Email yuborish',false),
  ('/v1/notifications/telegram','POST','notifications','notify:write','Send Telegram','Telegram yuborish',false),
  -- Maps
  ('/v1/maps/nearby','GET','maps','*','Nearby clinics','Yaqin atrofdagi klinikalar',true),
  ('/v1/maps/geofence','GET','maps','*','Geofencing','Geofence ma''lumotlari',true)
ON CONFLICT DO NOTHING;

-- Seed initial SDK versions
INSERT INTO public.api_sdk_versions(language, version, is_latest, changelog) VALUES
  ('flutter','0.1.0',true,'Initial release — Auth, User, AI, Clinics, Appointments, EMR, Payments, Notifications, Maps'),
  ('javascript','0.1.0',true,'Initial release'),
  ('kotlin','0.1.0',true,'Initial release'),
  ('swift','0.1.0',true,'Initial release'),
  ('curl','1.0.0',true,'cURL examples')
ON CONFLICT DO NOTHING;
