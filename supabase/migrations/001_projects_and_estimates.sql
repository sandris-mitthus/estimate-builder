-- Estimate Builder: projects + estimate documents

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.estimates (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null unique references public.projects (id) on delete cascade,
  title text not null default '',
  meta jsonb not null default '{}'::jsonb,
  categories jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index estimates_project_id_idx on public.estimates (project_id);

create trigger projects_set_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();

create trigger estimates_set_updated_at
  before update on public.estimates
  for each row execute function public.set_updated_at();

alter table public.projects enable row level security;
alter table public.estimates enable row level security;

-- Server uses service role (bypasses RLS). Add user policies when auth ships.
