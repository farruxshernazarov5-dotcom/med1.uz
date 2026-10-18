create table public.telegram_link_tokens (
  token text primary key default encode(extensions.gen_random_bytes(18),'hex'),
  user_id uuid not null,
  expires_at timestamptz not null default now() + interval '15 minutes',
  created_at timestamptz not null default now()
);
grant all on public.telegram_link_tokens to service_role;
alter table public.telegram_link_tokens enable row level security;

create table public.internal_job_secrets (
  name text primary key,
  secret text not null default encode(extensions.gen_random_bytes(24),'hex')
);
grant all on public.internal_job_secrets to service_role;
alter table public.internal_job_secrets enable row level security;
insert into public.internal_job_secrets(name) values ('emedinfo_daily') on conflict do nothing;

select cron.schedule('emedinfo-daily-2000-tashkent', '0 15 * * *', $$
  select net.http_post(
    url := 'https://wiqcfyecdmararxqdmfk.supabase.co/functions/v1/emedinfo-bot/daily',
    headers := jsonb_build_object('Content-Type','application/json','x-job-secret',(select secret from public.internal_job_secrets where name='emedinfo_daily')),
    body := '{}'::jsonb);
$$);