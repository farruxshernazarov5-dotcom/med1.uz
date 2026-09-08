create or replace function public.sync_doctor_photo_urls(_ids uuid[], _base text)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare n integer;
begin
  update public.doctors_external d
     set photo_url = _base || '/' || d.id::text || '.webp'
   where d.id = any(_ids)
     and (d.photo_url is null or d.photo_url = '' or d.photo_url <> _base || '/' || d.id::text || '.webp');
  get diagnostics n = row_count;
  return n;
end;
$$;

revoke all on function public.sync_doctor_photo_urls(uuid[], text) from public, anon, authenticated;
grant execute on function public.sync_doctor_photo_urls(uuid[], text) to service_role;