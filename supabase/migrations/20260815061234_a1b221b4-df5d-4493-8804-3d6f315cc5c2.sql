INSERT INTO public.tenant_subscriptions (owner_id, tenant_type, module_id, plan_id, tier, billing_period, status, started_at, expires_at, auto_renew, metadata)
SELECT '43b144ae-402d-469e-8061-41de954ff5a9'::uuid, 'organization', 'clinic', p.id, 'enterprise', 'yearly', 'active', now(), now() + interval '10 years', true, jsonb_build_object('granted_by','admin','reason','premium_unlock')
FROM public.saas_plans p
WHERE p.module_id = 'clinic' AND p.tier = 'enterprise'
ON CONFLICT (owner_id, module_id) DO UPDATE
SET tier = 'enterprise',
    plan_id = EXCLUDED.plan_id,
    status = 'active',
    expires_at = EXCLUDED.expires_at,
    billing_period = 'yearly',
    updated_at = now();