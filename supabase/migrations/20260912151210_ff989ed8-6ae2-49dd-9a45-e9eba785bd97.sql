CREATE TABLE public.support_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  subject text NOT NULL DEFAULT 'Qo''llab-quvvatlash' CHECK (char_length(subject) BETWEEN 1 AND 160),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'waiting', 'closed')),
  last_message_at timestamptz NOT NULL DEFAULT now(),
  user_last_read_at timestamptz,
  admin_last_read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);
GRANT SELECT, INSERT, UPDATE ON public.support_conversations TO authenticated;
GRANT ALL ON public.support_conversations TO service_role;
ALTER TABLE public.support_conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Patients can view own support conversation"
ON public.support_conversations FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Patients can create own support conversation"
ON public.support_conversations FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());
CREATE POLICY "Patients can update own support read state"
ON public.support_conversations FOR UPDATE TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.support_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.support_conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  sender_role text NOT NULL CHECK (sender_role IN ('patient', 'admin')),
  content text NOT NULL CHECK (char_length(content) BETWEEN 1 AND 4000),
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.support_messages TO authenticated;
GRANT ALL ON public.support_messages TO service_role;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Participants can view support messages"
ON public.support_messages FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.support_conversations c
    WHERE c.id = conversation_id
      AND (c.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  )
);
CREATE POLICY "Participants can send support messages"
ON public.support_messages FOR INSERT TO authenticated
WITH CHECK (
  sender_id = auth.uid()
  AND (
    (sender_role = 'admin' AND public.has_role(auth.uid(), 'admin'))
    OR
    (sender_role = 'patient' AND EXISTS (
      SELECT 1 FROM public.support_conversations c
      WHERE c.id = conversation_id AND c.user_id = auth.uid() AND c.status <> 'closed'
    ))
  )
);
CREATE POLICY "Participants can mark support messages read"
ON public.support_messages FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.support_conversations c
    WHERE c.id = conversation_id
      AND (c.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.support_conversations c
    WHERE c.id = conversation_id
      AND (c.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  )
);

CREATE INDEX support_conversations_status_last_message_idx
ON public.support_conversations(status, last_message_at DESC);
CREATE INDEX support_messages_conversation_created_idx
ON public.support_messages(conversation_id, created_at);

CREATE OR REPLACE FUNCTION public.touch_support_conversation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.support_conversations
  SET last_message_at = NEW.created_at,
      updated_at = now(),
      status = CASE WHEN NEW.sender_role = 'patient' THEN 'open' ELSE 'waiting' END
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.touch_support_conversation() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.touch_support_conversation() TO service_role;
CREATE TRIGGER support_message_touch_conversation
AFTER INSERT ON public.support_messages
FOR EACH ROW EXECUTE FUNCTION public.touch_support_conversation();

CREATE OR REPLACE FUNCTION public.validate_support_conversation_update()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
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
CREATE TRIGGER validate_support_conversation_update_trigger
BEFORE UPDATE ON public.support_conversations
FOR EACH ROW EXECUTE FUNCTION public.validate_support_conversation_update();

ALTER PUBLICATION supabase_realtime ADD TABLE public.support_conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.support_messages;