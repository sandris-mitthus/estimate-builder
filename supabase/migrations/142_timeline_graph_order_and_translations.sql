-- Priority order for timeline graph projects + UI translations.

create table if not exists public.company_timeline_graph_order (
  company_id uuid not null references public.companies (id) on delete cascade,
  project_id uuid not null references public.projects (id) on delete cascade,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (company_id, project_id)
);

create index if not exists company_timeline_graph_order_company_sort_idx
on public.company_timeline_graph_order (company_id, sort_order, project_id);

drop trigger if exists company_timeline_graph_order_set_updated_at
on public.company_timeline_graph_order;
create trigger company_timeline_graph_order_set_updated_at
  before update on public.company_timeline_graph_order
  for each row execute function public.set_updated_at();

alter table public.company_timeline_graph_order enable row level security;

drop policy if exists "company_timeline_graph_order deny client access"
on public.company_timeline_graph_order;
create policy "company_timeline_graph_order deny client access"
on public.company_timeline_graph_order
as restrictive
for all
to anon, authenticated
using (false)
with check (false);

with translations (translation_key, namespace, description, lv, en) as (
  values
    (
      'timeline_graph.page.subtitle',
      'timeline_graph',
      'Timeline graph page subtitle',
      'Darbietilpība no projekta tāmes. Velc projektus, lai iestatītu prioritātes secību.',
      'Workload from the project estimate. Drag projects to set priority order.'
    ),
    (
      'timeline_graph.empty',
      'timeline_graph',
      'Empty timeline graph message',
      'Nav apstiprinātu projektu.',
      'No approved projects.'
    ),
    (
      'timeline_graph.column.workload',
      'timeline_graph',
      'Labor workload column label',
      'Darbietilpība',
      'Workload'
    ),
    (
      'timeline_graph.drag',
      'timeline_graph',
      'Drag handle aria label',
      'Mainīt prioritāti',
      'Change priority'
    ),
    (
      'timeline_graph.feedback.reordered',
      'timeline_graph',
      'Success after reordering projects',
      'Prioritātes secība saglabāta.',
      'Priority order saved.'
    ),
    (
      'errors.timeline_graph_projects_required',
      'errors',
      'No projects provided for timeline graph reorder',
      'Nav projektu secībai.',
      'No projects to reorder.'
    )
)
insert into public.site_translations (translation_key, namespace, description, values)
select
  translation_key,
  namespace,
  description,
  jsonb_build_object('lv', lv, 'en', en)
from translations
on conflict (translation_key) do update
set
  namespace = excluded.namespace,
  description = excluded.description,
  values = public.site_translations.values || excluded.values,
  updated_at = now();
