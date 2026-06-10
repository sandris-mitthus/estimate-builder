-- Ēku moduļu katalogs

create table if not exists public.building_modules (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists building_modules_name_idx on public.building_modules (name);

drop trigger if exists building_modules_set_updated_at on public.building_modules;
create trigger building_modules_set_updated_at
  before update on public.building_modules
  for each row execute function public.set_updated_at();

alter table public.building_modules enable row level security;

drop policy if exists "building_modules deny client access" on public.building_modules;
create policy "building_modules deny client access"
on public.building_modules
as restrictive
for all
to anon, authenticated
using (false)
with check (false);

insert into public.building_modules (id, name, address)
values
  (
    '33333333-3333-3333-3333-333333333301',
    'Biroja ēka — tips A',
    'Standarta 3 stāvu biroja modulis, 420 m²'
  ),
  (
    '33333333-3333-3333-3333-333333333302',
    'Noliktavas modulis — tips B',
    'Viena līmeņa noliktava ar rampu, 680 m²'
  ),
  (
    '33333333-3333-3333-3333-333333333303',
    'Dzīvojamā ēka — tips C',
    'Divu dzīvokļu modulis, 186 m²'
  )
on conflict (id) do nothing;
