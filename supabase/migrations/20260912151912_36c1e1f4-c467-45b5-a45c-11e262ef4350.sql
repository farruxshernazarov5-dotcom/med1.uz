CREATE OR REPLACE FUNCTION public.validate_support_conversation_update()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF pg_trigger_depth() > 1 THEN
    NEW.updated_at := now();
    RETURN NEW;
  END IF;
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    IF NEW.user_id IS DISTINCT FROM OLD.user_id
       OR NEW.subject IS DISTINCT FROM OLD.subject
       OR NEW.status IS DISTINCT FROM OLD.status
       OR NEW.admin_last_read_at IS DISTINCT FROM OLD.admin_last_read_at
       OR NEW.last_message_at IS DISTINCT FROM OLD.last_message_at
       OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
      RAISE EXCEPTION 'Only support operators can change conversation details';
    END IF;
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.validate_support_conversation_update() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.validate_support_conversation_update() FROM anon;
REVOKE ALL ON FUNCTION public.validate_support_conversation_update() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.validate_support_conversation_update() TO service_role;