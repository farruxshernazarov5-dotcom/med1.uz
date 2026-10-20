ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS telegram_sent_at timestamptz;
INSERT INTO public.internal_job_secrets(name) VALUES ('emedinfo_notify') ON CONFLICT DO NOTHING;

CREATE OR REPLACE FUNCTION public.notify_telegram_on_notification()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.user_id IS NULL THEN RETURN NEW; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE user_id = NEW.user_id AND telegram_chat_id IS NOT NULL AND telegram_chat_id <> '') THEN
    RETURN NEW;
  END IF;
  BEGIN
    PERFORM net.http_post(
      url := 'https://wiqcfyecdmararxqdmfk.supabase.co/functions/v1/emedinfo-bot/notify',
      headers := jsonb_build_object('Content-Type','application/json','x-job-secret',(SELECT secret FROM public.internal_job_secrets WHERE name='emedinfo_notify')),
      body := jsonb_build_object('id', NEW.id)
    );
  EXCEPTION WHEN OTHERS THEN
    -- Telegram delivery must never block the in-app notification.
    NULL;
  END;
  RETURN NEW;
END $$;

REVOKE EXECUTE ON FUNCTION public.notify_telegram_on_notification() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_notifications_telegram ON public.notifications;
CREATE TRIGGER trg_notifications_telegram AFTER INSERT ON public.notifications
FOR EACH ROW EXECUTE FUNCTION public.notify_telegram_on_notification();