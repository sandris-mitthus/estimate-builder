-- Company workers directory (name, phone, optional photo).

create table if not exists public.company_workers (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  first_name text not null,
  last_name text not null,
  phone text not null default '',
  phone_calling_code text not null default '+371',
  photo_path text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, id),
  constraint company_workers_first_name_check check (length(trim(first_name)) > 0),
  constraint company_workers_last_name_check check (length(trim(last_name)) > 0)
);

create index if not exists company_workers_company_sort_order_idx
on public.company_workers (company_id, sort_order, last_name, first_name);

drop trigger if exists company_workers_set_updated_at on public.company_workers;
create trigger company_workers_set_updated_at
  before update on public.company_workers
  for each row execute function public.set_updated_at();

alter table public.company_workers enable row level security;

drop policy if exists "company_workers deny client access" on public.company_workers;
create policy "company_workers deny client access"
on public.company_workers
as restrictive
for all
to anon, authenticated
using (false)
with check (false);

update public.site_user_groups
set
  permissions = jsonb_set(
    jsonb_set(
      jsonb_set(permissions, '{nav,workers}', 'true'::jsonb, true),
      '{actions,workers.manage}',
      'true'::jsonb,
      true
    ),
    '{nav,workers}',
    'true'::jsonb,
    true
  ),
  updated_at = now()
where slug = 'admin';

update public.site_user_groups
set
  permissions = jsonb_set(
    jsonb_set(permissions, '{nav,workers}', 'true'::jsonb, true),
    '{actions,workers.manage}',
    'false'::jsonb,
    true
  ),
  updated_at = now()
where slug = 'viewer';

update public.company_user_groups
set
  permissions = jsonb_set(
    jsonb_set(permissions, '{nav,workers}', 'true'::jsonb, true),
    '{actions,workers.manage}',
    permissions #> '{actions,positions.manage}',
    true
  ),
  updated_at = now()
where slug = 'admin'
  and is_system = true;

update public.company_user_groups
set
  permissions = jsonb_set(
    jsonb_set(permissions, '{nav,workers}', 'true'::jsonb, true),
    '{actions,workers.manage}',
    'false'::jsonb,
    true
  ),
  updated_at = now()
where slug = 'viewer'
  and is_system = true;
