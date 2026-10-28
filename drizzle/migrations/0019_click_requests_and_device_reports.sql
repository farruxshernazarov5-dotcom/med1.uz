CREATE TABLE public.click_partner_requests (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, kind text NOT NULL DEFAULT 'support', subject text NOT NULL, message text NOT NULL DEFAULT '', status text NOT NULL DEFAULT 'new', response text NOT NULL DEFAULT '', platform text, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT click_request_kind CHECK (kind IN ('support','sdk_report','device_link')),
 CONSTRAINT click_request_status CHECK (status IN ('new','in_progress','resolved','client_reported','server_confirmed')),
 CONSTRAINT click_request_lengths CHECK (length(subject) BETWEEN 1 AND 160 AND length(message)<=2000 AND length(response)<=2000)
);
GRANT SELECT, INSERT ON public.click_partner_requests TO authenticated;
GRANT UPDATE ON public.click_partner_requests TO authenticated;
GRANT ALL ON public.click_partner_requests TO service_role;
ALTER TABLE public.click_partner_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Click owners and admins read" ON public.click_partner_requests FOR SELECT TO authenticated USING (user_id=auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Click users submit unverified requests" ON public.click_partner_requests FOR INSERT TO authenticated WITH CHECK (user_id=auth.uid() AND response='' AND ((kind='support' AND status='new') OR (kind='sdk_report' AND status='client_reported')));
CREATE POLICY "Click admins respond" ON public.click_partner_requests FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE INDEX click_requests_created_idx ON public.click_partner_requests(created_at DESC);
ALTER TABLE public.device_link_tokens ADD COLUMN source_slug text;
REVOKE INSERT ON public.device_link_tokens FROM authenticated;
CREATE OR REPLACE FUNCTION public.click_device_link_report() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF NEW.source_slug='click' AND OLD.used_at IS NULL AND NEW.used_at IS NOT NULL THEN
 INSERT INTO public.click_partner_requests(user_id,kind,subject,message,status) VALUES(NEW.user_id,'device_link','QR ulanish tokeni ishlatildi','Server bir martalik QR tokenini qabul qildi. Bu Click shaxsini tasdiqlash yoki telefonda yakuniy kirish tasdig‘i emas.','server_confirmed');
 END IF;
 RETURN NEW;
END; $$;
CREATE TRIGGER click_device_link_report AFTER UPDATE OF used_at ON public.device_link_tokens FOR EACH ROW EXECUTE FUNCTION public.click_device_link_report();