CREATE OR REPLACE FUNCTION public.validate_support_message_update()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.conversation_id IS DISTINCT FROM OLD.conversation_id
     OR NEW.sender_id IS DISTINCT FROM OLD.sender_id
     OR NEW.sender_role IS DISTINCT FROM OLD.sender_role
     OR NEW.content IS DISTINCT FROM OLD.content
     OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'Support message content is immutable';
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.validate_support_message_update() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.validate_support_message_update() FROM anon;
REVOKE ALL ON FUNCTION public.validate_support_message_update() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.validate_support_message_update() TO service_role;
CREATE TRIGGER validate_support_message_update_trigger
BEFORE UPDATE ON public.support_messages
FOR EACH ROW EXECUTE FUNCTION public.validate_support_message_update();