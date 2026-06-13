-- Piedāvājumā neiekļautās pozīcijas (uzņēmuma līmeņa saraksts)

create table if not exists public.excluded_positions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists excluded_positions_sort_order_idx
  on public.excluded_positions (sort_order);

drop trigger if exists excluded_positions_set_updated_at on public.excluded_positions;
create trigger excluded_positions_set_updated_at
  before update on public.excluded_positions
  for each row execute function public.set_updated_at();

alter table public.excluded_positions enable row level security;

drop policy if exists "excluded_positions deny client access" on public.excluded_positions;
create policy "excluded_positions deny client access"
on public.excluded_positions
as restrictive
for all
to anon, authenticated
using (false)
with check (false);
