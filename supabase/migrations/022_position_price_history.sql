-- Cenu izmaiņu vēsture pozīciju katalogam

create table if not exists public.position_price_history (
  id uuid primary key default gen_random_uuid(),
  position_price_id uuid not null references public.position_prices(id) on delete cascade,
  unit_price numeric(12, 2) not null,
  recorded_at date not null,
  supplier_name text not null default '',
  supplier_contact_name text not null default '',
  supplier_email text not null default '',
  supplier_phone text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists position_price_history_position_recorded_idx
  on public.position_price_history (position_price_id, recorded_at desc, created_at desc);

alter table public.position_price_history enable row level security;

drop policy if exists "position_price_history deny client access" on public.position_price_history;
create policy "position_price_history deny client access"
on public.position_price_history
as restrictive
for all
to anon, authenticated
using (false)
with check (false);

insert into public.position_price_history (
  position_price_id,
  unit_price,
  recorded_at,
  supplier_name,
  supplier_contact_name,
  supplier_email,
  supplier_phone
)
select
  p.id,
  p.unit_price,
  coalesce(p.unit_price_updated_at, p.updated_at::date),
  p.supplier_name,
  p.supplier_contact_name,
  p.supplier_email,
  p.supplier_phone
from public.position_prices p
where p.unit_price is not null
  and not exists (
    select 1
    from public.position_price_history h
    where h.position_price_id = p.id
  );
