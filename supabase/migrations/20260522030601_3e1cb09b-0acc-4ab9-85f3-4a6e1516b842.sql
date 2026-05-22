
-- Approval columns on contracts
DO $$ BEGIN
  CREATE TYPE public.contract_approval_status AS ENUM ('pending','approved','rejected','not_required');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.contracts
  ADD COLUMN IF NOT EXISTS approval_status public.contract_approval_status NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS approval_notes TEXT,
  ADD COLUMN IF NOT EXISTS rejected_reason TEXT,
  ADD COLUMN IF NOT EXISTS required_signatures INT NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS collected_signatures INT NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_contracts_approval ON public.contracts(approval_status);

-- Trigger: when a valid signature inserted, bump counter; if reaches required and approved -> active
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

DROP TRIGGER IF EXISTS trg_contract_after_signature ON public.contract_signatures;
CREATE TRIGGER trg_contract_after_signature
  AFTER INSERT ON public.contract_signatures
  FOR EACH ROW EXECUTE FUNCTION public.contract_after_signature();

-- Admin approve / reject helper
CREATE OR REPLACE FUNCTION public.admin_review_contract(
  _contract_id UUID,
  _decision TEXT,        -- 'approved' | 'rejected'
  _notes TEXT DEFAULT NULL
) RETURNS public.contracts
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_row public.contracts;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  IF _decision NOT IN ('approved','rejected') THEN
    RAISE EXCEPTION 'invalid decision';
  END IF;

  UPDATE public.contracts
    SET approval_status = _decision::public.contract_approval_status,
        approved_by = auth.uid(),
        approved_at = now(),
        approval_notes = CASE WHEN _decision = 'approved' THEN _notes ELSE approval_notes END,
        rejected_reason = CASE WHEN _decision = 'rejected' THEN _notes ELSE rejected_reason END,
        status = CASE
          WHEN _decision = 'rejected' THEN 'cancelled'::contract_status
          WHEN _decision = 'approved' AND collected_signatures >= required_signatures THEN 'active'::contract_status
          ELSE status
        END,
        signed_at = CASE
          WHEN _decision = 'approved' AND collected_signatures >= required_signatures AND signed_at IS NULL THEN now()
          ELSE signed_at
        END,
        updated_at = now()
    WHERE id = _contract_id
  RETURNING * INTO v_row;

  INSERT INTO public.contract_notifications(contract_id, user_id, channel, kind, payload)
  VALUES (
    _contract_id,
    v_row.owner_id,
    'in_app',
    'admin_' || _decision,
    jsonb_build_object('notes', _notes, 'admin_id', auth.uid())
  );

  RETURN v_row;
END $$;
