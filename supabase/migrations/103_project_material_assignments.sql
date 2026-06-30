create table if not exists public.project_material_assignments (
  company_id uuid not null references public.companies (id) on delete cascade,
  project_id uuid not null references public.projects (id) on delete cascade,
  position_price_id text not null,
  assignee_user_id uuid not null references public.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (company_id, project_id, position_price_id)
);

create index if not exists project_material_assignments_assignee_idx
on public.project_material_assignments (company_id, assignee_user_id);

create index if not exists project_material_assignments_project_idx
on public.project_material_assignments (company_id, project_id);

drop trigger if exists project_material_assignments_set_updated_at
on public.project_material_assignments;

create trigger project_material_assignments_set_updated_at
  before update on public.project_material_assignments
  for each row execute function public.set_updated_at();

alter table public.project_material_assignments enable row level security;

drop policy if exists "project_material_assignments deny client access"
on public.project_material_assignments;

create policy "project_material_assignments deny client access"
on public.project_material_assignments
as restrictive
for all
to anon, authenticated
using (false)
with check (false);

insert into public.project_material_assignments (
  company_id,
  project_id,
  position_price_id,
  assignee_user_id
)
select
  estimates.company_id,
  estimates.project_id,
  assignment.key,
  assignment.value::uuid
from public.estimates estimates
cross join lateral jsonb_each_text(
  case
    when jsonb_typeof(estimates.meta -> 'materialAssigneeUserIds') = 'object'
      then estimates.meta -> 'materialAssigneeUserIds'
    else '{}'::jsonb
  end
) as assignment(key, value)
where assignment.value ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  and not exists (
    select 1
    from jsonb_array_elements_text(
      case
        when jsonb_typeof(estimates.meta -> 'orderedMaterialPositionIds') = 'array'
          then estimates.meta -> 'orderedMaterialPositionIds'
        else '[]'::jsonb
      end
    ) as ordered(position_price_id)
    where ordered.position_price_id = assignment.key
  )
on conflict (company_id, project_id, position_price_id) do update
set assignee_user_id = excluded.assignee_user_id;
