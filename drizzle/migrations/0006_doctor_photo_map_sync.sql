create or replace function public.sync_doctor_photo_map(_map jsonb)
returns integer language plpgsql security definer set search_path = public as $$
declare n integer;
begin
  update public.doctors_external d set photo_url = e.value #>> '{}'
  from jsonb_each(_map) e
  where d.id = e.key::uuid and (e.value #>> '{}') like 'https://%';
  get diagnostics n = row_count;
  return n;
end; $$;
revoke all on function public.sync_doctor_photo_map(jsonb) from public, anon, authenticated;
grant execute on function public.sync_doctor_photo_map(jsonb) to service_role;