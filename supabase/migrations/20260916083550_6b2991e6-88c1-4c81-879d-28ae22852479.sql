DELETE FROM public.user_roles WHERE user_id = '1e0e21c1-838c-4a99-94b1-6e32585a18e8';
INSERT INTO public.user_roles (user_id, role) VALUES ('1e0e21c1-838c-4a99-94b1-6e32585a18e8', 'doctor')
ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO public.tenant_subscriptions (owner_id, module_id, tier, status)
SELECT '1e0e21c1-838c-4a99-94b1-6e32585a18e8', 'doctor', 'free', 'active'
WHERE NOT EXISTS (
  SELECT 1 FROM public.tenant_subscriptions
  WHERE owner_id = '1e0e21c1-838c-4a99-94b1-6e32585a18e8' AND module_id = 'doctor'
);