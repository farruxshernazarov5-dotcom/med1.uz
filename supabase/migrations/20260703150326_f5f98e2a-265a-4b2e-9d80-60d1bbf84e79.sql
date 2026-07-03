
CREATE OR REPLACE FUNCTION public.notify_security_log_entry()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  should_notify boolean := false;
BEGIN
  -- Fire for warn/error and AI token-cap overages; subscribers' min_priority
  -- and error_only preferences are enforced inside the security-notify function.
  IF NEW.level IN ('warn','error') OR NEW.scope = 'ai-token-cap' THEN
    should_notify := true;
  END IF;

  IF should_notify THEN
    BEGIN
      PERFORM net.http_post(
        url := 'https://wiqcfyecdmararxqdmfk.supabase.co/functions/v1/security-notify',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'apikey', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndpcWNmeWVjZG1hcmFyeHFkbWZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1MTIxNTcsImV4cCI6MjA4ODA4ODE1N30.XVZkwo_-OftGBMVMhoE6VJ1tM-w98evIJbg1atEU1cI',
          'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndpcWNmeWVjZG1hcmFyeHFkbWZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1MTIxNTcsImV4cCI6MjA4ODA4ODE1N30.XVZkwo_-OftGBMVMhoE6VJ1tM-w98evIJbg1atEU1cI'
        ),
        body := jsonb_build_object('entryId', NEW.id)
      );
    EXCEPTION WHEN OTHERS THEN
      -- Never block the insert if the async dispatch fails
      RAISE WARNING 'security-notify dispatch failed: %', SQLERRM;
    END;
  END IF;
  RETURN NEW;
END;
$function$;
