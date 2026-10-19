CREATE OR REPLACE FUNCTION public.appointments_server_price()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _svc numeric := 0; _doc numeric := 0;
BEGIN
  -- Clinic owners and admins may set a custom price; everyone else gets the catalogue price.
  IF public.has_role(auth.uid(), 'admin') OR EXISTS (
    SELECT 1 FROM public.registered_clinics c WHERE c.id = NEW.clinic_id AND c.owner_id = auth.uid()
  ) OR auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'UPDATE' AND NEW.total_price IS NOT DISTINCT FROM OLD.total_price
     AND NEW.service_id IS NOT DISTINCT FROM OLD.service_id
     AND NEW.doctor_id IS NOT DISTINCT FROM OLD.doctor_id THEN
    RETURN NEW;
  END IF;
  IF NEW.service_id IS NOT NULL THEN
    SELECT COALESCE(price, 0) INTO _svc FROM public.clinic_services WHERE id = NEW.service_id AND clinic_id = NEW.clinic_id;
  END IF;
  IF NEW.doctor_id IS NOT NULL THEN
    SELECT COALESCE(consultation_price, 0) INTO _doc FROM public.doctors WHERE id = NEW.doctor_id;
  END IF;
  NEW.total_price := COALESCE(_svc, 0) + COALESCE(_doc, 0);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_appointments_server_price ON public.appointments;
CREATE TRIGGER trg_appointments_server_price
BEFORE INSERT OR UPDATE ON public.appointments
FOR EACH ROW EXECUTE FUNCTION public.appointments_server_price();