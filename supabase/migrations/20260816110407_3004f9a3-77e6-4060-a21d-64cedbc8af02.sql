-- 1. Diagnostics radiology studies: drop broken owner policy
DROP POLICY IF EXISTS "Owners manage their radiology studies" ON public.diagnostics_radiology_studies;

-- 2. Diagnostics service packages: replace broken owner check with join-based ownership
DROP POLICY IF EXISTS "Owners manage their diag packages" ON public.diagnostics_service_packages;
CREATE POLICY "Center owner manages diag packages"
ON public.diagnostics_service_packages
FOR ALL
TO authenticated
USING (EXISTS (SELECT 1 FROM public.registered_diagnostics rd WHERE rd.id = diagnostics_service_packages.center_id AND rd.owner_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.registered_diagnostics rd WHERE rd.id = diagnostics_service_packages.center_id AND rd.owner_id = auth.uid()));

-- 3. Doctor chat: patients may report, but cannot clear moderation state
CREATE OR REPLACE FUNCTION public.guard_doctor_chat_moderation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN NEW;
  END IF;

  -- non-admins can never unhide or unflag, and cannot alter content/attachments
  NEW.is_hidden := OLD.is_hidden;
  NEW.content := OLD.content;
  NEW.attachment_url := OLD.attachment_url;
  NEW.attachment_name := OLD.attachment_name;
  NEW.attachment_type := OLD.attachment_type;
  NEW.sender_id := OLD.sender_id;
  NEW.sender_role := OLD.sender_role;
  NEW.patient_id := OLD.patient_id;
  NEW.doctor_id := OLD.doctor_id;

  IF COALESCE(OLD.is_flagged, false) THEN
    NEW.is_flagged := OLD.is_flagged;
    NEW.flag_reason := OLD.flag_reason;
  ELSE
    -- may only raise a flag, never lower it
    NEW.is_flagged := COALESCE(NEW.is_flagged, false);
    IF NOT NEW.is_flagged THEN
      NEW.flag_reason := OLD.flag_reason;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.guard_doctor_chat_moderation() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_guard_doctor_chat_moderation ON public.doctor_ext_chat_messages;
CREATE TRIGGER trg_guard_doctor_chat_moderation
BEFORE UPDATE ON public.doctor_ext_chat_messages
FOR EACH ROW EXECUTE FUNCTION public.guard_doctor_chat_moderation();

-- 4. Referral wallet: inserts must start at zero balances
DROP POLICY IF EXISTS "owner upsert wallet" ON public.referral_wallet;
CREATE POLICY "owner upsert wallet"
ON public.referral_wallet
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = owner_id
  AND COALESCE(credits_balance, 0) = 0
  AND COALESCE(ai_credits_balance, 0) = 0
  AND COALESCE(months_balance, 0) = 0
  AND COALESCE(lifetime_earned, 0) = 0
  AND COALESCE(lifetime_spent, 0) = 0
);

-- 5. Revoke public execute on internal SECURITY DEFINER routines
REVOKE ALL ON FUNCTION public.cancel_doctor_appointment_reminders() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.enqueue_doctor_appointment_reminders() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.sync_doctor_appointment_payment() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.validate_doctor_ext_review() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.is_clinic_owner(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_clinic_owner(uuid) TO authenticated;