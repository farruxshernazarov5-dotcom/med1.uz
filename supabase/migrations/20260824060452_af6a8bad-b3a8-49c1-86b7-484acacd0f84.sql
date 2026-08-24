
CREATE OR REPLACE FUNCTION public.med1_ad_fulfill_payment()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _cid uuid;
BEGIN
  IF NEW.status <> 'paid' OR COALESCE(OLD.status,'') = 'paid' THEN RETURN NEW; END IF;
  IF NEW.purpose IS NULL OR NEW.purpose NOT LIKE 'med1_ad%' THEN RETURN NEW; END IF;
  BEGIN
    _cid := NEW.reference_id::uuid;
  EXCEPTION WHEN others THEN
    RETURN NEW;
  END;

  UPDATE public.med1_ad_campaigns c
     SET paid_amount = COALESCE(c.paid_amount,0) + NEW.amount,
         payment_id  = NEW.id,
         status      = CASE WHEN c.status IN ('rejected','ai_flagged') THEN c.status ELSE 'pending'::public.med1_ad_status END
   WHERE c.id = _cid;

  RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION public.med1_ad_fulfill_payment() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_med1_ad_fulfill_payment ON public.platform_payments;
CREATE TRIGGER trg_med1_ad_fulfill_payment
AFTER UPDATE ON public.platform_payments
FOR EACH ROW EXECUTE FUNCTION public.med1_ad_fulfill_payment();
