-- ============================================================
-- MED1.UZ FULL SaaS CONTROL SYSTEM
-- ============================================================

-- 1. Modules catalog (Klinika, Diagnostika, Dental, Pharmacy, ...)
CREATE TABLE IF NOT EXISTS public.saas_modules (
  id TEXT PRIMARY KEY,           -- 'clinic','diagnostics','dental','pharmacy','cosmetology','maternity','medtech','bloodbank','doctor'
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  icon TEXT DEFAULT 'Layers',
  is_active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Plans per module + tier (free/starter/pro/enterprise)
CREATE TABLE IF NOT EXISTS public.saas_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id TEXT NOT NULL REFERENCES public.saas_modules(id) ON DELETE CASCADE,
  tier TEXT NOT NULL CHECK (tier IN ('free','starter','pro','enterprise')),
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  price_monthly NUMERIC(12,2) NOT NULL DEFAULT 0,
  price_yearly NUMERIC(12,2) NOT NULL DEFAULT 0,
  features JSONB NOT NULL DEFAULT '[]'::jsonb,         -- ['lab','radiology','ai','reports'...]
  limits JSONB NOT NULL DEFAULT '{}'::jsonb,           -- {"patients":100,"appointments":200,"ai_requests":50,"storage_mb":500}
  is_popular BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(module_id, tier)
);

-- 3. Tenant (organization or doctor) subscriptions per module
CREATE TABLE IF NOT EXISTS public.tenant_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL,                              -- auth.users.id of owner/admin
  tenant_type TEXT NOT NULL DEFAULT 'organization',    -- 'organization'|'doctor'|'patient'
  tenant_ref_id UUID,                                  -- ref to clinics/diagnostics_centers/etc.
  module_id TEXT NOT NULL REFERENCES public.saas_modules(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES public.saas_plans(id) ON DELETE SET NULL,
  tier TEXT NOT NULL DEFAULT 'free',
  billing_period TEXT DEFAULT 'monthly',               -- monthly|yearly
  status TEXT NOT NULL DEFAULT 'active',               -- active|expired|cancelled|trial
  started_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,                              -- null = no expiry
  trial_ends_at TIMESTAMPTZ,
  auto_renew BOOLEAN DEFAULT false,
  last_invoice_id UUID,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(owner_id, module_id)
);

CREATE INDEX IF NOT EXISTS idx_tenant_sub_owner ON public.tenant_subscriptions(owner_id);
CREATE INDEX IF NOT EXISTS idx_tenant_sub_module ON public.tenant_subscriptions(module_id);
CREATE INDEX IF NOT EXISTS idx_tenant_sub_status ON public.tenant_subscriptions(status);

-- 4. Usage counters (per owner + module + period)
CREATE TABLE IF NOT EXISTS public.saas_usage_counters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL,
  module_id TEXT NOT NULL,
  metric TEXT NOT NULL,                                -- 'patients','appointments','ai_requests','lab_orders','storage_mb'
  period_start DATE NOT NULL DEFAULT date_trunc('month', now())::date,
  used INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(owner_id, module_id, metric, period_start)
);

CREATE INDEX IF NOT EXISTS idx_usage_owner_module ON public.saas_usage_counters(owner_id, module_id);

-- 5. SaaS audit log
CREATE TABLE IF NOT EXISTS public.saas_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID,
  actor_id UUID,
  module_id TEXT,
  action TEXT NOT NULL,                                -- 'access_blocked','limit_exceeded','plan_upgraded','login','module_action'
  resource TEXT,
  detail JSONB DEFAULT '{}'::jsonb,
  ip TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_saas_audit_owner ON public.saas_audit_log(owner_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_saas_audit_action ON public.saas_audit_log(action);

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE public.saas_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saas_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saas_usage_counters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saas_audit_log ENABLE ROW LEVEL SECURITY;

-- Modules: public read, admin write
CREATE POLICY "modules_public_read" ON public.saas_modules FOR SELECT USING (true);
CREATE POLICY "modules_admin_write" ON public.saas_modules FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Plans: public read, admin write
CREATE POLICY "plans_public_read" ON public.saas_plans FOR SELECT USING (true);
CREATE POLICY "plans_admin_write" ON public.saas_plans FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Subscriptions: owner sees own, admin all
CREATE POLICY "sub_owner_select" ON public.tenant_subscriptions FOR SELECT TO authenticated
  USING (owner_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "sub_owner_insert" ON public.tenant_subscriptions FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "sub_admin_update" ON public.tenant_subscriptions FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR owner_id = auth.uid())
  WITH CHECK (public.has_role(auth.uid(),'admin') OR owner_id = auth.uid());
CREATE POLICY "sub_admin_delete" ON public.tenant_subscriptions FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin'));

-- Usage: owner read, service_role/admin write (edge function uses service role)
CREATE POLICY "usage_owner_read" ON public.saas_usage_counters FOR SELECT TO authenticated
  USING (owner_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "usage_admin_write" ON public.saas_usage_counters FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Audit: owner read own, admin all
CREATE POLICY "audit_owner_read" ON public.saas_audit_log FOR SELECT TO authenticated
  USING (owner_id = auth.uid() OR actor_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "audit_insert_self" ON public.saas_audit_log FOR INSERT TO authenticated
  WITH CHECK (actor_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

-- ============================================================
-- Triggers
-- ============================================================
CREATE TRIGGER trg_saas_plans_upd BEFORE UPDATE ON public.saas_plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER trg_tenant_sub_upd BEFORE UPDATE ON public.tenant_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================================
-- Helper SQL function: get effective plan + limits for an owner+module
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_saas_access(_owner_id UUID, _module TEXT)
RETURNS TABLE(tier TEXT, status TEXT, expires_at TIMESTAMPTZ, features JSONB, limits JSONB)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    COALESCE(s.tier,'free') AS tier,
    COALESCE(s.status,'active') AS status,
    s.expires_at,
    COALESCE(p.features,'[]'::jsonb) AS features,
    COALESCE(p.limits,'{}'::jsonb) AS limits
  FROM (SELECT 1) x
  LEFT JOIN public.tenant_subscriptions s
    ON s.owner_id = _owner_id AND s.module_id = _module
  LEFT JOIN public.saas_plans p
    ON p.id = s.plan_id
  LIMIT 1;
$$;

-- ============================================================
-- Seed: modules
-- ============================================================
INSERT INTO public.saas_modules(id,name,description,icon,sort_order) VALUES
  ('clinic','Klinika HMS','Klinika boshqaruv tizimi','Hospital',1),
  ('diagnostics','Diagnostika (LIS/RIS)','Laboratoriya va radiologiya','FlaskConical',2),
  ('dental','Stomatologiya','Dental klinika boshqaruv','Smile',3),
  ('pharmacy','Dorixona','Farmatsevtika boshqaruv','Pill',4),
  ('cosmetology','Kosmetologiya','Go''zallik salonlari','Sparkles',5),
  ('maternity','Tug''ruqxona','Perinatal markaz','Baby',6),
  ('medtech','Med Texnika','Tibbiy uskunalar','Cpu',7),
  ('bloodbank','Qon banki','Donor markaz','Droplet',8),
  ('doctor','Mustaqil shifokor','Shaxsiy shifokor kabineti','Stethoscope',9)
ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name, description=EXCLUDED.description;

-- ============================================================
-- Seed: 4 tiers per module (Free / Starter / Pro / Enterprise)
-- Limits: -1 = unlimited
-- ============================================================
INSERT INTO public.saas_plans(module_id,tier,name,price_monthly,price_yearly,features,limits,is_popular,sort_order) VALUES
-- CLINIC
('clinic','free','Free',0,0,
 '["overview","patients","appointments"]'::jsonb,
 '{"patients":50,"appointments":100,"staff":2,"ai_requests":10,"storage_mb":200}'::jsonb, false,1),
('clinic','starter','Starter',299000,2990000,
 '["overview","patients","appointments","billing","staff","reports"]'::jsonb,
 '{"patients":300,"appointments":600,"staff":8,"ai_requests":50,"storage_mb":2000}'::jsonb, false,2),
('clinic','pro','Pro',699000,6990000,
 '["overview","patients","appointments","billing","staff","reports","emr","lab","ai","queue","telegram"]'::jsonb,
 '{"patients":2000,"appointments":5000,"staff":25,"ai_requests":300,"storage_mb":15000}'::jsonb, true,3),
('clinic','enterprise','Enterprise',1499000,14990000,
 '["overview","patients","appointments","billing","staff","reports","emr","lab","ai","queue","telegram","analytics","audit","sso","api"]'::jsonb,
 '{"patients":-1,"appointments":-1,"staff":-1,"ai_requests":-1,"storage_mb":100000}'::jsonb, false,4),

-- DIAGNOSTICS
('diagnostics','free','Free',0,0,
 '["patients","orders","results"]'::jsonb,
 '{"patients":50,"lab_orders":100,"ai_requests":10,"storage_mb":300}'::jsonb, false,1),
('diagnostics','starter','Starter',249000,2490000,
 '["patients","orders","results","templates","invoices","reports"]'::jsonb,
 '{"patients":500,"lab_orders":800,"ai_requests":40,"storage_mb":2000}'::jsonb, false,2),
('diagnostics','pro','Pro',599000,5990000,
 '["patients","orders","results","templates","invoices","reports","radiology","sop","qc","appointments","referrals","ai","settings"]'::jsonb,
 '{"patients":2500,"lab_orders":4000,"ai_requests":250,"storage_mb":15000}'::jsonb, true,3),
('diagnostics','enterprise','Enterprise',1299000,12990000,
 '["patients","orders","results","templates","invoices","reports","radiology","sop","qc","appointments","referrals","ai","settings","analytics","audit","api","multi_branch"]'::jsonb,
 '{"patients":-1,"lab_orders":-1,"ai_requests":-1,"storage_mb":100000}'::jsonb, false,4),

-- DENTAL
('dental','free','Free',0,0,
 '["overview","patients","appointments"]'::jsonb,
 '{"patients":50,"appointments":100,"staff":2,"storage_mb":200}'::jsonb, false,1),
('dental','starter','Starter',299000,2990000,
 '["overview","patients","appointments","billing","staff","services"]'::jsonb,
 '{"patients":300,"appointments":600,"staff":5,"storage_mb":1500}'::jsonb, false,2),
('dental','pro','Pro',699000,6990000,
 '["overview","patients","appointments","billing","staff","services","tooth-chart","treatment-plans","lab","documents","inventory","reports","recall"]'::jsonb,
 '{"patients":2000,"appointments":5000,"staff":15,"storage_mb":10000}'::jsonb, true,3),
('dental','enterprise','Enterprise',1499000,14990000,
 '["overview","patients","appointments","billing","staff","services","tooth-chart","treatment-plans","lab","documents","inventory","reports","recall","ai","analytics","saas","audit","imaging"]'::jsonb,
 '{"patients":-1,"appointments":-1,"staff":-1,"storage_mb":50000}'::jsonb, false,4),

-- PHARMACY
('pharmacy','free','Free',0,0,'["overview","inventory"]'::jsonb,'{"products":100,"sales":200,"storage_mb":200}'::jsonb,false,1),
('pharmacy','starter','Starter',199000,1990000,'["overview","inventory","sales","invoices"]'::jsonb,'{"products":500,"sales":2000,"storage_mb":1500}'::jsonb,false,2),
('pharmacy','pro','Pro',499000,4990000,'["overview","inventory","sales","invoices","reports","barcode","prescriptions","ai"]'::jsonb,'{"products":3000,"sales":15000,"storage_mb":8000}'::jsonb,true,3),
('pharmacy','enterprise','Enterprise',999000,9990000,'["overview","inventory","sales","invoices","reports","barcode","prescriptions","ai","analytics","multi_branch","api","audit"]'::jsonb,'{"products":-1,"sales":-1,"storage_mb":50000}'::jsonb,false,4),

-- COSMETOLOGY
('cosmetology','free','Free',0,0,'["overview","clients"]'::jsonb,'{"clients":30,"appointments":80,"storage_mb":200}'::jsonb,false,1),
('cosmetology','starter','Starter',249000,2490000,'["overview","clients","appointments","services","billing"]'::jsonb,'{"clients":300,"appointments":600,"storage_mb":1500}'::jsonb,false,2),
('cosmetology','pro','Pro',549000,5490000,'["overview","clients","appointments","services","billing","inventory","reports","ai","photos"]'::jsonb,'{"clients":1500,"appointments":3000,"storage_mb":10000}'::jsonb,true,3),
('cosmetology','enterprise','Enterprise',1199000,11990000,'["overview","clients","appointments","services","billing","inventory","reports","ai","photos","analytics","audit","multi_branch"]'::jsonb,'{"clients":-1,"appointments":-1,"storage_mb":50000}'::jsonb,false,4),

-- MATERNITY
('maternity','free','Free',0,0,'["overview","patients"]'::jsonb,'{"patients":50,"appointments":100,"storage_mb":300}'::jsonb,false,1),
('maternity','starter','Starter',349000,3490000,'["overview","patients","appointments","emr","billing"]'::jsonb,'{"patients":300,"appointments":600,"storage_mb":2000}'::jsonb,false,2),
('maternity','pro','Pro',799000,7990000,'["overview","patients","appointments","emr","billing","ultrasound","prenatal","lab","ai","reports"]'::jsonb,'{"patients":1500,"appointments":3000,"storage_mb":15000}'::jsonb,true,3),
('maternity','enterprise','Enterprise',1599000,15990000,'["overview","patients","appointments","emr","billing","ultrasound","prenatal","lab","ai","reports","nicu","analytics","audit"]'::jsonb,'{"patients":-1,"appointments":-1,"storage_mb":80000}'::jsonb,false,4),

-- MEDTECH
('medtech','free','Free',0,0,'["overview","catalog"]'::jsonb,'{"products":50,"orders":50,"storage_mb":200}'::jsonb,false,1),
('medtech','starter','Starter',199000,1990000,'["overview","catalog","orders","invoices"]'::jsonb,'{"products":300,"orders":500,"storage_mb":1500}'::jsonb,false,2),
('medtech','pro','Pro',499000,4990000,'["overview","catalog","orders","invoices","reports","service","warranty"]'::jsonb,'{"products":2000,"orders":3000,"storage_mb":8000}'::jsonb,true,3),
('medtech','enterprise','Enterprise',999000,9990000,'["overview","catalog","orders","invoices","reports","service","warranty","analytics","audit","api"]'::jsonb,'{"products":-1,"orders":-1,"storage_mb":50000}'::jsonb,false,4),

-- BLOODBANK
('bloodbank','free','Free',0,0,'["overview","donors"]'::jsonb,'{"donors":100,"requests":50,"storage_mb":200}'::jsonb,false,1),
('bloodbank','starter','Starter',249000,2490000,'["overview","donors","inventory","requests"]'::jsonb,'{"donors":500,"requests":300,"storage_mb":1500}'::jsonb,false,2),
('bloodbank','pro','Pro',549000,5490000,'["overview","donors","inventory","requests","screening","reports","notifications"]'::jsonb,'{"donors":3000,"requests":2000,"storage_mb":8000}'::jsonb,true,3),
('bloodbank','enterprise','Enterprise',1099000,10990000,'["overview","donors","inventory","requests","screening","reports","notifications","analytics","audit","api"]'::jsonb,'{"donors":-1,"requests":-1,"storage_mb":50000}'::jsonb,false,4),

-- DOCTOR
('doctor','free','Free',0,0,'["overview","patients","appointments"]'::jsonb,'{"patients":30,"appointments":50,"ai_requests":10,"storage_mb":200}'::jsonb,false,1),
('doctor','starter','Starter',99000,990000,'["overview","patients","appointments","emr","prescriptions"]'::jsonb,'{"patients":200,"appointments":400,"ai_requests":40,"storage_mb":1000}'::jsonb,false,2),
('doctor','pro','Pro',249000,2490000,'["overview","patients","appointments","emr","prescriptions","billing","telemed","ai","analytics"]'::jsonb,'{"patients":1000,"appointments":2000,"ai_requests":200,"storage_mb":5000}'::jsonb,true,3),
('doctor','enterprise','Enterprise',499000,4990000,'["overview","patients","appointments","emr","prescriptions","billing","telemed","ai","analytics","audit","api"]'::jsonb,'{"patients":-1,"appointments":-1,"ai_requests":-1,"storage_mb":20000}'::jsonb,false,4)
ON CONFLICT (module_id,tier) DO UPDATE SET
  features=EXCLUDED.features, limits=EXCLUDED.limits,
  price_monthly=EXCLUDED.price_monthly, price_yearly=EXCLUDED.price_yearly;