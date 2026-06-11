-- Tāmes pozīciju bibliotēka (atkārtojamas tāmes struktūras)

create table if not exists public.estimate_positions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  title text not null default '',
  categories jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists estimate_positions_name_idx on public.estimate_positions (name);

drop trigger if exists estimate_positions_set_updated_at on public.estimate_positions;
create trigger estimate_positions_set_updated_at
  before update on public.estimate_positions
  for each row execute function public.set_updated_at();

alter table public.estimate_positions enable row level security;

drop policy if exists "estimate_positions deny client access" on public.estimate_positions;
create policy "estimate_positions deny client access"
on public.estimate_positions
as restrictive
for all
to anon, authenticated
using (false)
with check (false);
