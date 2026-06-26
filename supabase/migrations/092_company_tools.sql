-- Company tools inventory with optional worker assignment.

create table if not exists public.company_tools (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  tool_number text not null,
  name text not null,
  purchase_date date,
  price numeric(12, 2),
  price_type text not null default 'purchase',
  assigned_worker_id uuid,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, id),
  unique (company_id, tool_number),
  constraint company_tools_name_check check (length(trim(name)) > 0),
  constraint company_tools_number_check check (length(trim(tool_number)) > 0),
  constraint company_tools_price_type_check check (price_type in ('purchase', 'amortization')),
  foreign key (company_id, assigned_worker_id)
    references public.company_workers (company_id, id)
    on delete set null
);

create index if not exists company_tools_company_sort_order_idx
on public.company_tools (company_id, sort_order, tool_number);

create index if not exists company_tools_company_worker_idx
on public.company_tools (company_id, assigned_worker_id);

drop trigger if exists company_tools_set_updated_at on public.company_tools;
create trigger company_tools_set_updated_at
  before update on public.company_tools
  for each row execute function public.set_updated_at();

alter table public.company_tools enable row level security;

drop policy if exists "company_tools deny client access" on public.company_tools;
create policy "company_tools deny client access"
on public.company_tools
as restrictive
for all
to anon, authenticated
using (false)
with check (false);

update public.site_user_groups
set
  permissions = jsonb_set(
    jsonb_set(permissions, '{nav,tools}', 'true'::jsonb, true),
    '{actions,tools.manage}',
    'true'::jsonb,
    true
  ),
  updated_at = now()
where slug = 'admin';

update public.site_user_groups
set
  permissions = jsonb_set(
    jsonb_set(permissions, '{nav,tools}', 'true'::jsonb, true),
    '{actions,tools.manage}',
    'false'::jsonb,
    true
  ),
  updated_at = now()
where slug = 'viewer';

update public.company_user_groups
set
  permissions = jsonb_set(
    jsonb_set(permissions, '{nav,tools}', 'true'::jsonb, true),
    '{actions,tools.manage}',
    permissions #> '{actions,positions.manage}',
    true
  ),
  updated_at = now()
where slug = 'admin'
  and is_system = true;

update public.company_user_groups
set
  permissions = jsonb_set(
    jsonb_set(permissions, '{nav,tools}', 'true'::jsonb, true),
    '{actions,tools.manage}',
    'false'::jsonb,
    true
  ),
  updated_at = now()
where slug = 'viewer'
  and is_system = true;
