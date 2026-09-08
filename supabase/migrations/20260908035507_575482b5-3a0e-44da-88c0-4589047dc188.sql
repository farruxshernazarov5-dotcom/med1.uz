
-- 1. Unified public partner organizations list
CREATE OR REPLACE FUNCTION public.get_partner_organizations(_limit integer DEFAULT 60)
RETURNS TABLE (
  id uuid,
  org_type text,
  name text,
  logo_url text,
  city text,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM (
    SELECT c.id, 'clinic'::text, c.name,
           NULLIF(COALESCE(NULLIF(c.logo_url,''), NULLIF(c.logo_external_url,'')),'') ,
           NULLIF(c.service_city,''), c.created_at
      FROM public.registered_clinics c WHERE c.is_active
    UNION ALL
    SELECT d.id, 'diagnostics', d.name, NULLIF(d.logo_url,''), NULLIF(d.city,''), d.created_at
      FROM public.registered_diagnostics d WHERE d.is_active
    UNION ALL
    SELECT p.id, 'pharmacy', p.name, NULLIF(p.logo_url,''), NULLIF(p.city,''), p.created_at
      FROM public.registered_pharmacies p WHERE p.is_active
    UNION ALL
    SELECT dc.id, 'dental', dc.name, NULLIF(dc.logo_url,''), NULLIF(dc.city,''), dc.created_at
      FROM public.registered_dental_clinics dc WHERE dc.is_active
    UNION ALL
    SELECT co.id, 'cosmetology', co.name, NULLIF(co.logo_url,''), NULLIF(co.city,''), co.created_at
      FROM public.registered_cosmetology co WHERE co.is_active
    UNION ALL
    SELECT m.id, 'maternity', m.name, NULLIF(m.logo_url,''), NULLIF(m.city,''), m.created_at
      FROM public.registered_maternity m WHERE m.is_active
    UNION ALL
    SELECT b.id, 'bloodbank', b.name, NULL::text, NULLIF(b.city,''), b.created_at
      FROM public.blood_banks_registered b WHERE b.is_active
  ) t(id, org_type, name, logo_url, city, created_at)
  ORDER BY created_at DESC
  LIMIT GREATEST(1, LEAST(_limit, 200));
$$;

GRANT EXECUTE ON FUNCTION public.get_partner_organizations(integer) TO anon, authenticated, service_role;

-- 2. Auto-assign the default (free) tariff to every newly registered organization
CREATE OR REPLACE FUNCTION public.ensure_org_subscription()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _module text := TG_ARGV[0];
  _plan uuid;
BEGIN
  SELECT id INTO _plan FROM public.saas_plans
   WHERE module_id = _module AND tier = 'free' LIMIT 1;

  INSERT INTO public.tenant_subscriptions
    (owner_id, tenant_type, tenant_ref_id, module_id, plan_id, tier, status, started_at)
  VALUES
    (NEW.owner_id, 'organization', NEW.id, _module, _plan, 'free', 'active', now())
  ON CONFLICT (owner_id, module_id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sub_clinics ON public.registered_clinics;
CREATE TRIGGER trg_sub_clinics AFTER INSERT ON public.registered_clinics
  FOR EACH ROW EXECUTE FUNCTION public.ensure_org_subscription('clinic');
DROP TRIGGER IF EXISTS trg_sub_diag ON public.registered_diagnostics;
CREATE TRIGGER trg_sub_diag AFTER INSERT ON public.registered_diagnostics
  FOR EACH ROW EXECUTE FUNCTION public.ensure_org_subscription('diagnostics');
DROP TRIGGER IF EXISTS trg_sub_pharm ON public.registered_pharmacies;
CREATE TRIGGER trg_sub_pharm AFTER INSERT ON public.registered_pharmacies
  FOR EACH ROW EXECUTE FUNCTION public.ensure_org_subscription('pharmacy');
DROP TRIGGER IF EXISTS trg_sub_dental ON public.registered_dental_clinics;
CREATE TRIGGER trg_sub_dental AFTER INSERT ON public.registered_dental_clinics
  FOR EACH ROW EXECUTE FUNCTION public.ensure_org_subscription('dental');
DROP TRIGGER IF EXISTS trg_sub_cosm ON public.registered_cosmetology;
CREATE TRIGGER trg_sub_cosm AFTER INSERT ON public.registered_cosmetology
  FOR EACH ROW EXECUTE FUNCTION public.ensure_org_subscription('cosmetology');
DROP TRIGGER IF EXISTS trg_sub_mat ON public.registered_maternity;
CREATE TRIGGER trg_sub_mat AFTER INSERT ON public.registered_maternity
  FOR EACH ROW EXECUTE FUNCTION public.ensure_org_subscription('maternity');
DROP TRIGGER IF EXISTS trg_sub_blood ON public.blood_banks_registered;
CREATE TRIGGER trg_sub_blood AFTER INSERT ON public.blood_banks_registered
  FOR EACH ROW EXECUTE FUNCTION public.ensure_org_subscription('bloodbank');

-- 3. Backfill existing organizations
INSERT INTO public.tenant_subscriptions (owner_id, tenant_type, tenant_ref_id, module_id, plan_id, tier, status)
SELECT s.owner_id, 'organization', s.id, s.module_id,
       (SELECT p.id FROM public.saas_plans p WHERE p.module_id = s.module_id AND p.tier='free' LIMIT 1),
       'free', 'active'
FROM (
  SELECT owner_id, id, 'clinic' module_id FROM public.registered_clinics
  UNION ALL SELECT owner_id, id, 'diagnostics' FROM public.registered_diagnostics
  UNION ALL SELECT owner_id, id, 'pharmacy' FROM public.registered_pharmacies
  UNION ALL SELECT owner_id, id, 'dental' FROM public.registered_dental_clinics
  UNION ALL SELECT owner_id, id, 'cosmetology' FROM public.registered_cosmetology
  UNION ALL SELECT owner_id, id, 'maternity' FROM public.registered_maternity
  UNION ALL SELECT owner_id, id, 'bloodbank' FROM public.blood_banks_registered
) s
ON CONFLICT (owner_id, module_id) DO NOTHING;
