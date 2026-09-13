CREATE TABLE public.contract_signature_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  challenge_id UUID NOT NULL UNIQUE,
  canonical_payload TEXT NOT NULL,
  document_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  consumed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT ALL ON public.contract_signature_challenges TO service_role;
ALTER TABLE public.contract_signature_challenges ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_contract_signature_challenges_lookup
  ON public.contract_signature_challenges(contract_id, user_id, challenge_id)
  WHERE consumed_at IS NULL;

UPDATE public.contracts c
SET approval_status = 'not_required', updated_at = now()
FROM public.contract_templates t
WHERE c.template_id = t.id
  AND c.approval_status = 'pending'
  AND c.status = 'draft'
  AND t.slug IN (
    'clinic-hms-agreement','diagnostics-lis-agreement','dental-hms-agreement',
    'doctor-platform-agreement','maternity-hms-agreement','pharmacy-agreement',
    'cosmetology-center-agreement','medtech-vendor-agreement','saas-subscription-agreement'
  );