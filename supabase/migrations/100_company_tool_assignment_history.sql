create table if not exists public.company_tool_assignment_history (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  tool_id uuid not null,
  worker_id uuid,
  worker_name text not null,
  assigned_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  foreign key (company_id, tool_id)
    references public.company_tools (company_id, id)
    on delete cascade
);

create index if not exists company_tool_assignment_history_tool_time_idx
on public.company_tool_assignment_history (company_id, tool_id, assigned_at desc, created_at desc);

alter table public.company_tool_assignment_history enable row level security;

drop policy if exists "company_tool_assignment_history deny client access" on public.company_tool_assignment_history;
create policy "company_tool_assignment_history deny client access"
on public.company_tool_assignment_history
as restrictive
for all
to anon, authenticated
using (false)
with check (false);

insert into public.company_tool_assignment_history (
  company_id,
  tool_id,
  worker_id,
  worker_name,
  assigned_at
)
select
  tools.company_id,
  tools.id,
  workers.id,
  trim(concat(workers.first_name, ' ', workers.last_name)),
  tools.updated_at
from public.company_tools tools
join public.company_workers workers
  on workers.company_id = tools.company_id
 and workers.id = tools.assigned_worker_id
where tools.assigned_worker_id is not null
  and not exists (
    select 1
    from public.company_tool_assignment_history history
    where history.company_id = tools.company_id
      and history.tool_id = tools.id
      and history.worker_id = tools.assigned_worker_id
  );
