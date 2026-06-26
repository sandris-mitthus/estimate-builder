-- Timeline schedule entries for approved projects.

create table if not exists public.company_timeline_entries (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  project_id uuid not null references public.projects (id) on delete cascade,
  start_date date not null,
  end_date date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, project_id),
  constraint company_timeline_entries_date_order_check check (end_date >= start_date)
);

create index if not exists company_timeline_entries_company_dates_idx
on public.company_timeline_entries (company_id, start_date, end_date);

drop trigger if exists company_timeline_entries_set_updated_at on public.company_timeline_entries;
create trigger company_timeline_entries_set_updated_at
  before update on public.company_timeline_entries
  for each row execute function public.set_updated_at();

alter table public.company_timeline_entries enable row level security;

drop policy if exists "company_timeline_entries deny client access" on public.company_timeline_entries;
create policy "company_timeline_entries deny client access"
on public.company_timeline_entries
as restrictive
for all
to anon, authenticated
using (false)
with check (false);

update public.site_user_groups
set
  permissions = jsonb_set(
    jsonb_set(permissions, '{nav,timeline}', 'true'::jsonb, true),
    '{actions,timeline.manage}',
    'true'::jsonb,
    true
  ),
  updated_at = now()
where slug = 'admin';

update public.site_user_groups
set
  permissions = jsonb_set(
    jsonb_set(permissions, '{nav,timeline}', 'true'::jsonb, true),
    '{actions,timeline.manage}',
    'false'::jsonb,
    true
  ),
  updated_at = now()
where slug = 'viewer';

update public.company_user_groups
set
  permissions = jsonb_set(
    jsonb_set(permissions, '{nav,timeline}', 'true'::jsonb, true),
    '{actions,timeline.manage}',
    permissions #> '{actions,positions.manage}',
    true
  ),
  updated_at = now()
where slug = 'admin'
  and is_system = true;

update public.company_user_groups
set
  permissions = jsonb_set(
    jsonb_set(permissions, '{nav,timeline}', 'true'::jsonb, true),
    '{actions,timeline.manage}',
    'false'::jsonb,
    true
  ),
  updated_at = now()
where slug = 'viewer'
  and is_system = true;
