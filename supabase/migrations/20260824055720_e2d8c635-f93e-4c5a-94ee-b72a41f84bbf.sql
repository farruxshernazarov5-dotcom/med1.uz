
CREATE OR REPLACE FUNCTION public.med1_ads_recompute_ranks(_placement_id uuid DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.has_role(auth.uid(),'admin') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  UPDATE public.med1_ad_campaigns c SET status = 'expired'
   WHERE c.status = 'active' AND c.end_date IS NOT NULL AND c.end_date < now();

  WITH ranked AS (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY placement_id ORDER BY bid_amount DESC, created_at ASC) AS rn
    FROM public.med1_ad_campaigns
    WHERE status = 'active' AND (_placement_id IS NULL OR placement_id = _placement_id)
  )
  UPDATE public.med1_ad_campaigns c SET top_rank = r.rn FROM ranked r WHERE c.id = r.id AND c.top_rank IS DISTINCT FROM r.rn;
END; $$;

CREATE OR REPLACE FUNCTION public.med1_ads_track(_campaign_id uuid, _event_type text, _meta jsonb DEFAULT '{}'::jsonb)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _ok boolean;
BEGIN
  IF _event_type NOT IN ('impression','click','call','map','book','profile','social') THEN RETURN; END IF;
  SELECT EXISTS (SELECT 1 FROM public.med1_ad_campaigns c
                 WHERE c.id = _campaign_id AND c.status = 'active'
                   AND (c.end_date IS NULL OR c.end_date > now())) INTO _ok;
  IF NOT _ok THEN RETURN; END IF;

  INSERT INTO public.med1_ad_events (campaign_id, event_type, user_id, meta)
  VALUES (_campaign_id, _event_type, auth.uid(), '{}'::jsonb);
  IF _event_type = 'impression' THEN
    UPDATE public.med1_ad_campaigns SET impressions = impressions + 1 WHERE id = _campaign_id;
  ELSE
    UPDATE public.med1_ad_campaigns SET clicks = clicks + 1 WHERE id = _campaign_id;
  END IF;
END; $$;
