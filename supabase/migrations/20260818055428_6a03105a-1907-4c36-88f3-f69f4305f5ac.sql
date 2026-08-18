DELETE FROM public.platform_payments
WHERE status = 'pending'
  AND user_id = '49e9cd6d-8af4-4f0b-a865-78a7b3f4457e'
  AND created_at > now() - interval '30 minutes';