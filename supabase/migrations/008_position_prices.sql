-- Tāmes pozīciju katalogs

create table if not exists public.position_prices (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  unit text not null,
  unit_price numeric(12, 2),
  unit_price_updated_at date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists position_prices_name_idx on public.position_prices (name);

drop trigger if exists position_prices_set_updated_at on public.position_prices;
create trigger position_prices_set_updated_at
  before update on public.position_prices
  for each row execute function public.set_updated_at();

alter table public.position_prices enable row level security;

drop policy if exists "position_prices deny client access" on public.position_prices;
create policy "position_prices deny client access"
on public.position_prices
as restrictive
for all
to anon, authenticated
using (false)
with check (false);

insert into public.position_prices (id, name, unit)
values
  (
    '22222222-2222-2222-2222-222222222201',
    'Veģetācijas kārtas noņemšana un augsnes izvešana',
    'm³'
  ),
  (
    '22222222-2222-2222-2222-222222222202',
    'Monolīta dzelzsbetona pamatu liešana',
    'm³'
  ),
  (
    '22222222-2222-2222-2222-222222222203',
    'Vinila grīdas plāksnes ieklāšana',
    'm²'
  ),
  (
    '22222222-2222-2222-2222-222222222204',
    'Apgaismes ķermeņu uzstādīšana un pieslēgšana',
    'gab.'
  )
on conflict (id) do nothing;
