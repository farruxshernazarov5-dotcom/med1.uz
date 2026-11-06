create table public.push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  token text not null unique,
  platform text not null default 'android',
  last_daily_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index push_tokens_user_idx on public.push_tokens(user_id);
alter table public.push_tokens enable row level security;
grant select, insert, update, delete on public.push_tokens to authenticated;
grant all on public.push_tokens to service_role;
create policy "own push tokens select" on public.push_tokens for select to authenticated using (auth.uid() = user_id);
create policy "own push tokens insert" on public.push_tokens for insert to authenticated with check (auth.uid() = user_id);
create policy "own push tokens update" on public.push_tokens for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own push tokens delete" on public.push_tokens for delete to authenticated using (auth.uid() = user_id);

-- A token moving to another account on the same phone: let the owner reclaim it
create or replace function public.claim_push_token(_token text, _platform text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null or length(_token) < 20 or length(_token) > 4096 then raise exception 'invalid'; end if;
  insert into public.push_tokens(user_id, token, platform) values (auth.uid(), _token, left(coalesce(_platform,'android'),20))
  on conflict (token) do update set user_id = auth.uid(), platform = excluded.platform, updated_at = now();
end $$;
revoke all on function public.claim_push_token(text, text) from public, anon;
grant execute on function public.claim_push_token(text, text) to authenticated;