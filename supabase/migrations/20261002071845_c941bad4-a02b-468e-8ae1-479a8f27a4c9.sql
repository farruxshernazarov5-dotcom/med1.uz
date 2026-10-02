ALTER TABLE public.telegram_otp ADD COLUMN IF NOT EXISTS otp_attempts integer NOT NULL DEFAULT 0;
ALTER TABLE public.security_debug_log ADD COLUMN IF NOT EXISTS notify_token uuid NOT NULL DEFAULT gen_random_uuid();

CREATE OR REPLACE FUNCTION public.notify_security_log_entry()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.level IN ('warn','error') OR NEW.scope = 'ai-token-cap' THEN
    BEGIN
      PERFORM net.http_post(
        url := 'https://wiqcfyecdmararxqdmfk.supabase.co/functions/v1/security-notify',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'apikey', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndpcWNmeWVjZG1hcmFyeHFkbWZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1MTIxNTcsImV4cCI6MjA4ODA4ODE1N30.XVZkwo_-OftGBMVMhoE6VJ1tM-w98evIJbg1atEU1cI',
          'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndpcWNmeWVjZG1hcmFyeHFkbWZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1MTIxNTcsImV4cCI6MjA4ODA4ODE1N30.XVZkwo_-OftGBMVMhoE6VJ1tM-w98evIJbg1atEU1cI'
        ),
        body := jsonb_build_object('entryId', NEW.id, 'token', NEW.notify_token)
      );
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'security-notify dispatch failed: %', SQLERRM;
    END;
  END IF;
  RETURN NEW;
END;
$function$;