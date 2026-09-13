ALTER TYPE public.signature_method ADD VALUE IF NOT EXISTS 'eimzo';

ALTER TABLE public.contract_signatures
  ADD COLUMN IF NOT EXISTS pkcs7_signature TEXT,
  ADD COLUMN IF NOT EXISTS certificate_serial TEXT,
  ADD COLUMN IF NOT EXISTS certificate_subject TEXT,
  ADD COLUMN IF NOT EXISTS certificate_issuer TEXT,
  ADD COLUMN IF NOT EXISTS certificate_valid_from TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS certificate_valid_until TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS document_hash TEXT,
  ADD COLUMN IF NOT EXISTS verification_status TEXT NOT NULL DEFAULT 'not_checked',
  ADD COLUMN IF NOT EXISTS verification_details JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_contract_signatures_certificate_serial
  ON public.contract_signatures(certificate_serial)
  WHERE certificate_serial IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_contract_signatures_document_hash
  ON public.contract_signatures(document_hash)
  WHERE document_hash IS NOT NULL;

CREATE OR REPLACE FUNCTION public.contract_after_signature()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_req INT;
  v_count INT;
  v_approval public.contract_approval_status;
BEGIN
  SELECT required_signatures, approval_status INTO v_req, v_approval
    FROM public.contracts WHERE id = NEW.contract_id FOR UPDATE;

  SELECT COUNT(*) INTO v_count FROM public.contract_signatures
    WHERE contract_id = NEW.contract_id AND is_valid = true;

  UPDATE public.contracts
    SET collected_signatures = v_count,
        status = CASE
          WHEN v_count >= v_req AND v_approval IN ('approved','not_required') THEN 'active'::contract_status
          ELSE status
        END,
        signed_at = CASE
          WHEN v_count >= v_req AND signed_at IS NULL THEN now()
          ELSE signed_at
        END,
        updated_at = now()
    WHERE id = NEW.contract_id;
  RETURN NEW;
END $$;

REVOKE ALL ON FUNCTION public.contract_after_signature() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.contract_after_signature() TO service_role;