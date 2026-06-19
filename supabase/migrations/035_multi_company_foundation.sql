-- Multi-company foundation.
-- Existing data is assigned to one bootstrap company, then owned tables get company_id.

create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists companies_set_updated_at on public.companies;
create trigger companies_set_updated_at
  before update on public.companies
  for each row execute function public.set_updated_at();

alter table public.companies enable row level security;

drop policy if exists "companies deny client access" on public.companies;
create policy "companies deny client access"
on public.companies
as restrictive
for all
to anon, authenticated
using (false)
with check (false);

insert into public.companies (id, name)
values (
  '00000000-0000-0000-0000-000000000001',
  coalesce(
    nullif((select company_name from public.company_settings limit 1), ''),
    'Sākuma uzņēmums'
  )
)
on conflict (id) do update
set name = excluded.name;

create table if not exists public.company_users (
  company_id uuid not null references public.companies (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  role text not null default 'member',
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (company_id, user_id),
  constraint company_users_role_check
    check (role in ('owner', 'admin', 'member')),
  constraint company_users_status_check
    check (status in ('active', 'invited', 'disabled'))
);

create index if not exists company_users_user_id_idx
on public.company_users (user_id);

drop trigger if exists company_users_set_updated_at on public.company_users;
create trigger company_users_set_updated_at
  before update on public.company_users
  for each row execute function public.set_updated_at();

alter table public.company_users enable row level security;

drop policy if exists "company_users deny client access" on public.company_users;
create policy "company_users deny client access"
on public.company_users
as restrictive
for all
to anon, authenticated
using (false)
with check (false);

insert into public.company_users (company_id, user_id, role, status)
select
  '00000000-0000-0000-0000-000000000001',
  users.id,
  case when users.is_admin then 'owner' else 'member' end,
  'active'
from public.users users
on conflict (company_id, user_id) do nothing;

create table if not exists public.company_user_groups (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  slug text not null,
  name text not null,
  permissions jsonb not null default '{}'::jsonb,
  is_system boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, slug),
  unique (company_id, id)
);

drop trigger if exists company_user_groups_set_updated_at on public.company_user_groups;
create trigger company_user_groups_set_updated_at
  before update on public.company_user_groups
  for each row execute function public.set_updated_at();

alter table public.company_user_groups enable row level security;

drop policy if exists "company_user_groups deny client access" on public.company_user_groups;
create policy "company_user_groups deny client access"
on public.company_user_groups
as restrictive
for all
to anon, authenticated
using (false)
with check (false);

insert into public.company_user_groups (
  company_id,
  slug,
  name,
  permissions,
  is_system
)
select
  '00000000-0000-0000-0000-000000000001',
  user_groups.slug,
  user_groups.name,
  user_groups.permissions,
  user_groups.is_system
from public.user_groups user_groups
on conflict (company_id, slug) do nothing;

create table if not exists public.company_group_members (
  company_id uuid not null,
  user_id uuid not null,
  group_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (company_id, user_id),
  foreign key (company_id, user_id)
    references public.company_users (company_id, user_id)
    on delete cascade,
  foreign key (company_id, group_id)
    references public.company_user_groups (company_id, id)
    on delete restrict
);

create index if not exists company_group_members_group_id_idx
on public.company_group_members (group_id);

drop trigger if exists company_group_members_set_updated_at on public.company_group_members;
create trigger company_group_members_set_updated_at
  before update on public.company_group_members
  for each row execute function public.set_updated_at();

alter table public.company_group_members enable row level security;

drop policy if exists "company_group_members deny client access" on public.company_group_members;
create policy "company_group_members deny client access"
on public.company_group_members
as restrictive
for all
to anon, authenticated
using (false)
with check (false);

insert into public.company_group_members (company_id, user_id, group_id)
select
  '00000000-0000-0000-0000-000000000001',
  user_group_members.user_id,
  company_user_groups.id
from public.user_group_members user_group_members
join public.user_groups user_groups on user_groups.id = user_group_members.group_id
join public.company_user_groups company_user_groups
  on company_user_groups.company_id = '00000000-0000-0000-0000-000000000001'
  and company_user_groups.slug = user_groups.slug
join public.company_users company_users
  on company_users.company_id = company_user_groups.company_id
  and company_users.user_id = user_group_members.user_id
on conflict (company_id, user_id) do nothing;

insert into public.company_group_members (company_id, user_id, group_id)
select
  company_users.company_id,
  company_users.user_id,
  company_user_groups.id
from public.company_users company_users
join public.company_user_groups company_user_groups
  on company_user_groups.company_id = company_users.company_id
  and company_user_groups.slug = 'viewer'
where not exists (
  select 1
  from public.company_group_members existing_membership
  where existing_membership.company_id = company_users.company_id
    and existing_membership.user_id = company_users.user_id
)
on conflict (company_id, user_id) do nothing;

alter table public.projects
  add column if not exists company_id uuid references public.companies (id) on delete cascade;

update public.projects
set company_id = '00000000-0000-0000-0000-000000000001'
where company_id is null;

alter table public.projects
  alter column company_id set not null;

create index if not exists projects_company_id_created_at_idx
on public.projects (company_id, created_at);

create index if not exists projects_company_id_status_idx
on public.projects (company_id, status);

alter table public.estimates
  add column if not exists company_id uuid references public.companies (id) on delete cascade;

update public.estimates estimates
set company_id = projects.company_id
from public.projects projects
where estimates.project_id = projects.id
  and estimates.company_id is null;

alter table public.estimates
  alter column company_id set not null;

create index if not exists estimates_company_id_project_id_idx
on public.estimates (company_id, project_id);

alter table public.company_settings
  add column if not exists company_id uuid references public.companies (id) on delete cascade;

update public.company_settings
set company_id = '00000000-0000-0000-0000-000000000001'
where company_id is null;

alter table public.company_settings
  alter column company_id set not null;

alter table public.company_settings
  drop constraint if exists company_settings_id_check;

alter table public.company_settings
  drop constraint if exists company_settings_pkey;

alter table public.company_settings
  alter column id drop default,
  alter column id drop not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'company_settings_company_id_unique'
      and conrelid = 'public.company_settings'::regclass
  ) then
    alter table public.company_settings
      add constraint company_settings_company_id_unique unique (company_id);
  end if;
end;
$$;

alter table public.building_modules
  add column if not exists company_id uuid references public.companies (id) on delete cascade;

update public.building_modules
set company_id = '00000000-0000-0000-0000-000000000001'
where company_id is null;

alter table public.building_modules
  alter column company_id set not null;

create index if not exists building_modules_company_id_name_idx
on public.building_modules (company_id, name);

alter table public.position_prices
  add column if not exists company_id uuid references public.companies (id) on delete cascade;

update public.position_prices
set company_id = '00000000-0000-0000-0000-000000000001'
where company_id is null;

alter table public.position_prices
  alter column company_id set not null;

create index if not exists position_prices_company_id_name_idx
on public.position_prices (company_id, name);

alter table public.position_price_history
  add column if not exists company_id uuid references public.companies (id) on delete cascade;

update public.position_price_history history
set company_id = position_prices.company_id
from public.position_prices position_prices
where history.position_price_id = position_prices.id
  and history.company_id is null;

alter table public.position_price_history
  alter column company_id set not null;

create index if not exists position_price_history_company_position_recorded_idx
on public.position_price_history (
  company_id,
  position_price_id,
  recorded_at desc,
  created_at desc
);

alter table public.estimate_positions
  add column if not exists company_id uuid references public.companies (id) on delete cascade;

update public.estimate_positions
set company_id = '00000000-0000-0000-0000-000000000001'
where company_id is null;

alter table public.estimate_positions
  alter column company_id set not null;

create index if not exists estimate_positions_company_id_created_at_idx
on public.estimate_positions (company_id, created_at);

create index if not exists estimate_positions_company_id_name_idx
on public.estimate_positions (company_id, name);

alter table public.excluded_positions
  add column if not exists company_id uuid references public.companies (id) on delete cascade;

update public.excluded_positions
set company_id = '00000000-0000-0000-0000-000000000001'
where company_id is null;

alter table public.excluded_positions
  alter column company_id set not null;

create index if not exists excluded_positions_company_sort_order_idx
on public.excluded_positions (company_id, sort_order, created_at);
