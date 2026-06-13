-- User groups and per-group permissions (service role only; RLS deny for clients)

create table public.user_groups (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  permissions jsonb not null default '{}'::jsonb,
  is_system boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_group_members (
  user_id uuid primary key,
  group_id uuid not null references public.user_groups (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger user_groups_set_updated_at
  before update on public.user_groups
  for each row execute function public.set_updated_at();

create trigger user_group_members_set_updated_at
  before update on public.user_group_members
  for each row execute function public.set_updated_at();

alter table public.user_groups enable row level security;
alter table public.user_group_members enable row level security;

create policy "user_groups deny client access"
on public.user_groups
as restrictive
for all
to anon, authenticated
using (false)
with check (false);

create policy "user_group_members deny client access"
on public.user_group_members
as restrictive
for all
to anon, authenticated
using (false)
with check (false);

insert into public.user_groups (slug, name, permissions, is_system)
values
  (
    'admin',
    'Administrators',
    '{"nav":{"projects":true,"modules":true,"estimate":true,"positions":true,"excluded_positions":true,"users":true,"user_groups":true,"settings":true},"actions":{"project.create":true,"project.edit":true,"project.delete":true,"project.approve":true,"project.reject":true,"project.complete":true,"estimate.save":true,"estimate.export":true,"estimate.dates":true,"sagatave.save":true,"modules.manage":true,"positions.manage":true,"excluded_positions.manage":true,"project_module.manage":true,"users.invite":true,"users.assign_group":true,"groups.manage":true,"settings.save":true,"materials.assign":true,"materials.order":true}}'::jsonb,
    true
  ),
  (
    'manager',
    'Projektu vadītājs',
    '{"nav":{"projects":true,"modules":true,"estimate":true,"positions":true,"excluded_positions":true,"users":true,"user_groups":false,"settings":false},"actions":{"project.create":true,"project.edit":true,"project.delete":true,"project.approve":true,"project.reject":true,"project.complete":true,"estimate.save":true,"estimate.export":true,"estimate.dates":true,"sagatave.save":false,"modules.manage":true,"positions.manage":true,"excluded_positions.manage":true,"project_module.manage":true,"users.invite":false,"users.assign_group":false,"groups.manage":false,"settings.save":false,"materials.assign":true,"materials.order":true}}'::jsonb,
    true
  ),
  (
    'materials',
    'Materiālu pasūtīšana',
    '{"nav":{"projects":true,"modules":false,"estimate":false,"positions":false,"excluded_positions":false,"users":false,"user_groups":false,"settings":false},"actions":{"project.create":false,"project.edit":false,"project.delete":false,"project.approve":false,"project.reject":false,"project.complete":false,"estimate.save":false,"estimate.export":true,"estimate.dates":false,"sagatave.save":false,"modules.manage":false,"positions.manage":false,"excluded_positions.manage":false,"project_module.manage":false,"users.invite":false,"users.assign_group":false,"groups.manage":false,"settings.save":false,"materials.assign":false,"materials.order":true}}'::jsonb,
    true
  ),
  (
    'viewer',
    'Skatītājs',
    '{"nav":{"projects":true,"modules":true,"estimate":true,"positions":true,"excluded_positions":true,"users":false,"user_groups":false,"settings":false},"actions":{"project.create":false,"project.edit":false,"project.delete":false,"project.approve":false,"project.reject":false,"project.complete":false,"estimate.save":false,"estimate.export":true,"estimate.dates":false,"sagatave.save":false,"modules.manage":false,"positions.manage":false,"excluded_positions.manage":false,"project_module.manage":false,"users.invite":false,"users.assign_group":false,"groups.manage":false,"settings.save":false,"materials.assign":false,"materials.order":false}}'::jsonb,
    true
  )
on conflict (slug) do nothing;

-- Existing auth users become administrators
insert into public.user_group_members (user_id, group_id)
select u.id, g.id
from auth.users u
cross join public.user_groups g
where g.slug = 'admin'
on conflict (user_id) do nothing;
