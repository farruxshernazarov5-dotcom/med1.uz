CREATE OR REPLACE FUNCTION public.claim_push_token(_token text, _platform text)
 RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
declare _owner uuid;
begin
  if auth.uid() is null or length(_token) < 20 or length(_token) > 4096 then raise exception 'invalid'; end if;
  select user_id into _owner from public.push_tokens where token = _token;
  if _owner is not null and _owner <> auth.uid() then
    raise exception 'token already registered' using errcode = '42501';
  end if;
  insert into public.push_tokens(user_id, token, platform) values (auth.uid(), _token, left(coalesce(_platform,'android'),20))
  on conflict (token) do update set platform = excluded.platform, updated_at = now()
  where public.push_tokens.user_id = auth.uid();
end $function$;

REVOKE ALL ON FUNCTION public.update_ai_usage_result(uuid,text,integer,integer,integer,integer,numeric,text,text,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_ai_usage_result(uuid,text,integer,integer,integer,integer,numeric,text,text,text) TO service_role;