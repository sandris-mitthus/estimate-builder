-- Parallel work pairing on timeline graph (same project, shared start).

create table if not exists public.company_timeline_graph_parallel (
  company_id uuid not null references public.companies (id) on delete cascade,
  project_id uuid not null references public.projects (id) on delete cascade,
  section_id text not null,
  parallel_group_id text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (company_id, project_id, section_id)
);

create index if not exists company_timeline_graph_parallel_company_project_idx
on public.company_timeline_graph_parallel (company_id, project_id);

create index if not exists company_timeline_graph_parallel_group_idx
on public.company_timeline_graph_parallel (company_id, project_id, parallel_group_id);

drop trigger if exists company_timeline_graph_parallel_set_updated_at
on public.company_timeline_graph_parallel;
create trigger company_timeline_graph_parallel_set_updated_at
  before update on public.company_timeline_graph_parallel
  for each row execute function public.set_updated_at();

alter table public.company_timeline_graph_parallel enable row level security;

drop policy if exists "company_timeline_graph_parallel deny client access"
on public.company_timeline_graph_parallel;
create policy "company_timeline_graph_parallel deny client access"
on public.company_timeline_graph_parallel
as restrictive
for all
to anon, authenticated
using (false)
with check (false);

with translations (translation_key, namespace, description, lv, en) as (
  values
    (
      'timeline_graph.parallel.drag',
      'timeline_graph',
      'Drag handle to pair work in parallel',
      'Velc uz citu darbu, lai ietu paralēli',
      'Drag onto another job to run in parallel'
    ),
    (
      'timeline_graph.parallel.unpair',
      'timeline_graph',
      'Remove work from parallel group',
      'Atvienot no paralēlās grupas',
      'Unpair from parallel group'
    ),
    (
      'timeline_graph.parallel.drop_hint',
      'timeline_graph',
      'Drop target hint while pairing parallel work',
      'Nomej šeit, lai ietu paralēli',
      'Drop here to run in parallel'
    ),
    (
      'timeline_graph.parallel.badge',
      'timeline_graph',
      'Badge when work is in a parallel group',
      'Paralēli',
      'Parallel'
    ),
    (
      'timeline_graph.parallel.feedback.paired',
      'timeline_graph',
      'Success after pairing parallel work',
      'Darbi sapāroti paralēli.',
      'Jobs paired to run in parallel.'
    ),
    (
      'timeline_graph.parallel.feedback.unpaired',
      'timeline_graph',
      'Success after unpairing parallel work',
      'Darbs atvienots no paralēlās grupas.',
      'Job unpaired from parallel group.'
    ),
    (
      'errors.timeline_graph_parallel_invalid',
      'errors',
      'Invalid parallel pair request',
      'Nevar sapārot šos darbus.',
      'Cannot pair these jobs.'
    ),
    (
      'errors.timeline_graph_parallel_save_failed',
      'errors',
      'Failed to save parallel pairing',
      'Neizdevās saglabāt paralēlo sapārojumu.',
      'Failed to save parallel pairing.'
    ),
    (
      'timeline_graph.page.subtitle',
      'timeline_graph',
      'Timeline graph page subtitle',
      'Sakļauj projektu vienā rindā vai izvērs kategorijas un subkategorijas. Norādi cilvēku skaitu pie darba — grafiks saīsinās. Velc darbu uz citu darbu tajā pašā projektā, lai ietu paralēli. Velc projektu, lai mainītu prioritāti.',
      'Collapse a project to one row, or expand categories and subcategories. Set people on a job — the bar shortens. Drag a job onto another in the same project to run in parallel. Drag a project to change priority.'
    ),
    (
      'timeline_graph.page.subtitle_readonly',
      'timeline_graph',
      'Timeline graph subtitle when user cannot reorder',
      'Sakļauj projektu vienā rindā vai izvērs kategorijas un subkategorijas. Cilvēku skaits saīsina darba ilgumu; sapāroti darbi iet paralēli.',
      'Collapse a project to one row, or expand categories and subcategories. People count shortens duration; paired jobs run in parallel.'
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
