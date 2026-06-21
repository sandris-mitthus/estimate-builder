-- Global default user groups managed by system administrators.

create table if not exists public.site_user_groups (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text not null default '',
  permissions jsonb not null default '{}'::jsonb,
  is_default boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists site_user_groups_set_updated_at on public.site_user_groups;
create trigger site_user_groups_set_updated_at
  before update on public.site_user_groups
  for each row execute function public.set_updated_at();

alter table public.site_user_groups enable row level security;

drop policy if exists "site_user_groups deny client access" on public.site_user_groups;
create policy "site_user_groups deny client access"
on public.site_user_groups
as restrictive
for all
to anon, authenticated
using (false)
with check (false);

insert into public.site_user_groups (
  slug,
  name,
  description,
  permissions,
  is_default,
  sort_order
)
values
  (
    'admin',
    'Administrators',
    'Pilna sistēmas un uzņēmuma pārvaldības pieeja.',
    '{
      "nav": {
        "projects": true,
        "modules": true,
        "estimate": true,
        "positions": true,
        "excluded_positions": true,
        "users": true,
        "user_groups": true,
        "settings": true
      },
      "actions": {
        "project.create": true,
        "project.edit": true,
        "project.delete": true,
        "project.approve": true,
        "project.reject": true,
        "project.complete": true,
        "estimate.save": true,
        "estimate.export": true,
        "estimate.dates": true,
        "sagatave.save": true,
        "modules.manage": true,
        "positions.manage": true,
        "excluded_positions.manage": true,
        "project_module.manage": true,
        "users.invite": true,
        "users.assign_group": true,
        "users.manage_company_access": true,
        "groups.manage": true,
        "settings.save": true,
        "materials.assign": true,
        "materials.order": true
      }
    }'::jsonb,
    true,
    10
  ),
  (
    'viewer',
    'Skatītājs',
    'Lasīšanas pieeja bez pārvaldības darbībām.',
    '{
      "nav": {
        "projects": true,
        "modules": true,
        "estimate": true,
        "positions": true,
        "excluded_positions": true,
        "users": false,
        "user_groups": false,
        "settings": false
      },
      "actions": {
        "project.create": false,
        "project.edit": false,
        "project.delete": false,
        "project.approve": false,
        "project.reject": false,
        "project.complete": false,
        "estimate.save": false,
        "estimate.export": true,
        "estimate.dates": false,
        "sagatave.save": false,
        "modules.manage": false,
        "positions.manage": false,
        "excluded_positions.manage": false,
        "project_module.manage": false,
        "users.invite": false,
        "users.assign_group": false,
        "users.manage_company_access": false,
        "groups.manage": false,
        "settings.save": false,
        "materials.assign": false,
        "materials.order": false
      }
    }'::jsonb,
    true,
    20
  )
on conflict (slug) do nothing;
