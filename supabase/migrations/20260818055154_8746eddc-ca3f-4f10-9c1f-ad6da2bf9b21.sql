CREATE OR REPLACE FUNCTION public.click_fulfill_appointment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'completed' AND COALESCE(OLD.status,'') <> 'completed'
     AND NEW.purpose = 'doctor_appointment' AND NEW.reference_id IS NOT NULL THEN
    BEGIN
      UPDATE public.doctor_ext_appointments
        SET payment_status = 'paid', status = 'confirmed'
        WHERE id = NEW.reference_id::uuid;
    EXCEPTION WHEN others THEN NULL;
    END;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.click_fulfill_appointment() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_click_fulfill_appointment ON public.platform_payments;
CREATE TRIGGER trg_click_fulfill_appointment
AFTER UPDATE ON public.platform_payments
FOR EACH ROW EXECUTE FUNCTION public.click_fulfill_appointment();