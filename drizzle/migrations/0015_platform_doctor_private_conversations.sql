CREATE TABLE public.platform_doctor_messages (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 request_id uuid NOT NULL REFERENCES public.platform_doctor_requests(id) ON DELETE CASCADE,
 sender_id uuid NOT NULL,
 content text NOT NULL CHECK (char_length(content) BETWEEN 1 AND 2000),
 is_hidden boolean NOT NULL DEFAULT false,
 created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.platform_doctor_messages TO authenticated;
GRANT ALL ON public.platform_doctor_messages TO service_role;
ALTER TABLE public.platform_doctor_messages ENABLE ROW LEVEL SECURITY;
CREATE INDEX platform_doctor_messages_request ON public.platform_doctor_messages(request_id,created_at);
CREATE POLICY "Conversation participants read" ON public.platform_doctor_messages FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.platform_doctor_requests r JOIN public.doctors d ON d.id=r.doctor_id WHERE r.id=request_id AND (r.patient_id=auth.uid() OR d.user_id=auth.uid())));
CREATE POLICY "Conversation participants send" ON public.platform_doctor_messages FOR INSERT TO authenticated WITH CHECK (sender_id=auth.uid() AND EXISTS (SELECT 1 FROM public.platform_doctor_requests r JOIN public.doctors d ON d.id=r.doctor_id WHERE r.id=request_id AND r.status NOT IN ('declined','done') AND (r.patient_id=auth.uid() OR d.user_id=auth.uid())));
CREATE OR REPLACE FUNCTION public.mask_platform_doctor_message() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$ BEGIN
 NEW.is_hidden := NEW.content ~ '[0-9][0-9 -]{13,}[0-9]' OR NEW.content ~* '(password|parol|otp|pin|pasport|passport|cvv|cvc|karta|card|telefon|phone|manzil|address|email)' OR NEW.content ~ '[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}' OR NEW.content ~ '(\+998|998)[ -]*[0-9][0-9 -]{7,}[0-9]';
 RETURN NEW;
END $$;
CREATE TRIGGER mask_platform_message BEFORE INSERT ON public.platform_doctor_messages FOR EACH ROW EXECUTE FUNCTION public.mask_platform_doctor_message();
CREATE OR REPLACE FUNCTION public.notify_platform_doctor_message() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE recipient uuid; doctor uuid; patient uuid; doctor_user uuid; BEGIN
 SELECT r.patient_id,r.doctor_id,d.user_id INTO patient,doctor,doctor_user FROM public.platform_doctor_requests r JOIN public.doctors d ON d.id=r.doctor_id WHERE r.id=NEW.request_id;
 recipient := CASE WHEN NEW.sender_id=patient THEN doctor_user ELSE patient END;
 IF recipient IS NOT NULL THEN INSERT INTO public.notifications(user_id,title,message,type,link) VALUES(recipient,'Shifokor chatida yangi xabar','Shaxsiy xabarni Med1.uz kabinetida oching.','appointment',CASE WHEN recipient=patient THEN '/doctors/'||doctor ELSE '/dashboard/doctor?tab=leads' END); END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER notify_platform_message AFTER INSERT ON public.platform_doctor_messages FOR EACH ROW EXECUTE FUNCTION public.notify_platform_doctor_message();
CREATE OR REPLACE FUNCTION public.notify_platform_doctor_request() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE v_doctor_user uuid; v_label text; BEGIN
 v_label := CASE NEW.request_type WHEN 'chat' THEN 'chat' WHEN 'video' THEN 'video maslahat' WHEN 'booking' THEN 'qabul' ELSE 'savol' END;
 IF TG_OP='INSERT' THEN SELECT user_id INTO v_doctor_user FROM public.doctors WHERE id=NEW.doctor_id;
 IF v_doctor_user IS NOT NULL THEN INSERT INTO public.notifications(user_id,title,message,type,link) VALUES(v_doctor_user,'Yangi '||v_label||' so‘rovi','Shaxsiy so‘rovni kabinetda oching.','appointment','/dashboard/doctor?tab=leads'); END IF;
 ELSIF TG_OP='UPDATE' AND (NEW.status IS DISTINCT FROM OLD.status OR NEW.reply IS DISTINCT FROM OLD.reply OR NEW.meeting_url IS DISTINCT FROM OLD.meeting_url) THEN
 INSERT INTO public.notifications(user_id,title,message,type,link) VALUES(NEW.patient_id,'Shifokor '||v_label||' so‘rovingizga javob berdi','Javobni shifokor sahifasida oching.','appointment','/doctors/'||NEW.doctor_id);
 END IF;
 NEW.updated_at:=now(); RETURN NEW;
END $$;