ALTER TABLE public.push_tokens ADD COLUMN IF NOT EXISTS voice_id text NOT NULL DEFAULT 'kore';
ALTER TABLE public.push_tokens DROP CONSTRAINT IF EXISTS push_tokens_voice_id_check;
ALTER TABLE public.push_tokens ADD CONSTRAINT push_tokens_voice_id_check CHECK (voice_id IN ('kore','aoede','leda','zephyr','off'));
CREATE OR REPLACE FUNCTION public.set_push_voice(_voice text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  IF _voice NOT IN ('kore','aoede','leda','zephyr','off') THEN RAISE EXCEPTION 'invalid voice'; END IF;
  UPDATE public.push_tokens SET voice_id = _voice WHERE user_id = auth.uid();
END $$;
REVOKE ALL ON FUNCTION public.set_push_voice(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_push_voice(text) TO authenticated;