create table if not exists public.payme_fiscal_items (
  id uuid primary key default gen_random_uuid(),
  purpose text not null unique,
  title text not null,
  mxik_code text not null,
  package_code text not null,
  vat_percent integer not null default 12,
  units integer,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

grant select on public.payme_fiscal_items to authenticated;
grant all on public.payme_fiscal_items to service_role;
alter table public.payme_fiscal_items enable row level security;

create policy "Admins manage payme fiscal items"
on public.payme_fiscal_items for all to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

create table if not exists public.payme_webhook_log (
  id uuid primary key default gen_random_uuid(),
  method text,
  rpc_id text,
  payment_id uuid,
  payme_transaction_id text,
  request_ip text,
  request_body jsonb,
  response_body jsonb,
  status text not null default 'ok',
  error_note text,
  created_at timestamptz not null default now()
);

grant select on public.payme_webhook_log to authenticated;
grant all on public.payme_webhook_log to service_role;
alter table public.payme_webhook_log enable row level security;

create policy "Admins read payme webhook logs"
on public.payme_webhook_log for select to authenticated
using (public.has_role(auth.uid(), 'admin'));

create index if not exists idx_payme_log_created on public.payme_webhook_log (created_at desc);
create index if not exists idx_payme_log_tx on public.payme_webhook_log (payme_transaction_id);

insert into public.payme_fiscal_items (purpose, title, mxik_code, package_code, vat_percent)
values
  ('ai_subscription', 'MED1.UZ sun''iy intellekt xizmati obunasi', '10305001001000000', '1471385', 12),
  ('med_coin', 'MED1.UZ Med Coin (elektron xizmat birligi)', '10305001001000000', '1471385', 12),
  ('saas_subscription', 'MED1.UZ HMS dasturiy ta''minot obunasi', '10305001001000000', '1471385', 12),
  ('med1_top_ad', 'MED1 TOP reklama joylashtirish xizmati', '10306001001000000', '1471385', 12),
  ('clinic_service', 'Tibbiy xizmat uchun to''lov', '10307001001000000', '1471385', 0)
on conflict (purpose) do nothing;