
-- Webhook event triggers for HAMBI integration
-- Emits subscription.*, payment.*, medcoin.* events into api_webhook_deliveries

CREATE OR REPLACE FUNCTION public.trg_ai_subscription_webhook()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_event text;
BEGIN
  IF TG_OP = 'INSERT' THEN v_event := 'subscription.created';
  ELSIF NEW.status = 'active' AND COALESCE(OLD.status,'') <> 'active' THEN v_event := 'subscription.renewed';
  ELSIF NEW.status IN ('expired','cancelled') AND COALESCE(OLD.status,'') = 'active' THEN v_event := 'subscription.expired';
  ELSE RETURN NEW;
  END IF;
  PERFORM public.enqueue_webhook_event(v_event, jsonb_build_object(
    'id', NEW.id, 'user_id', NEW.user_id, 'tier', NEW.tier,
    'plan_id', NEW.plan_id, 'status', NEW.status, 'expires_at', NEW.expires_at,
    'occurred_at', now()
  ));
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS ai_subscriptions_webhook ON public.ai_subscriptions;
CREATE TRIGGER ai_subscriptions_webhook
AFTER INSERT OR UPDATE OF status ON public.ai_subscriptions
FOR EACH ROW EXECUTE FUNCTION public.trg_ai_subscription_webhook();

CREATE OR REPLACE FUNCTION public.trg_ai_payment_webhook()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_event text;
BEGIN
  IF NEW.status = 'completed' OR NEW.status = 'paid' OR NEW.status = 'success' THEN v_event := 'payment.success';
  ELSIF NEW.status IN ('failed','cancelled') THEN v_event := 'payment.failed';
  ELSE RETURN NEW;
  END IF;
  IF TG_OP = 'UPDATE' AND OLD.status = NEW.status THEN RETURN NEW; END IF;
  PERFORM public.enqueue_webhook_event(v_event, jsonb_build_object(
    'id', NEW.id, 'user_id', NEW.user_id, 'amount', NEW.amount,
    'payment_method', NEW.payment_method, 'status', NEW.status,
    'occurred_at', now()
  ));
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS ai_payments_webhook ON public.ai_payments;
CREATE TRIGGER ai_payments_webhook
AFTER INSERT OR UPDATE OF status ON public.ai_payments
FOR EACH ROW EXECUTE FUNCTION public.trg_ai_payment_webhook();

CREATE OR REPLACE FUNCTION public.trg_credit_history_webhook()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_event text;
BEGIN
  v_event := CASE
    WHEN NEW.type = 'purchase' THEN 'medcoin.purchased'
    WHEN NEW.type IN ('usage','deduct','spend') THEN 'medcoin.used'
    WHEN NEW.type = 'refund' THEN 'medcoin.refunded'
    ELSE NULL END;
  IF v_event IS NULL THEN RETURN NEW; END IF;
  PERFORM public.enqueue_webhook_event(v_event, jsonb_build_object(
    'id', NEW.id, 'user_id', NEW.user_id, 'amount', NEW.amount,
    'service_id', NEW.service_id, 'balance_after', NEW.balance_after,
    'occurred_at', now()
  ));
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS credit_history_webhook ON public.credit_history;
CREATE TRIGGER credit_history_webhook
AFTER INSERT ON public.credit_history
FOR EACH ROW EXECUTE FUNCTION public.trg_credit_history_webhook();
