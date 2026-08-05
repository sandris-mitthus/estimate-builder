-- People count per timeline-graph work section (shortens calendar duration).

create table if not exists public.company_timeline_graph_people (
  company_id uuid not null references public.companies (id) on delete cascade,
  project_id uuid not null references public.projects (id) on delete cascade,
  section_id text not null,
  people_count integer not null default 1
    check (people_count >= 1 and people_count <= 99),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (company_id, project_id, section_id)
);

create index if not exists company_timeline_graph_people_company_project_idx
on public.company_timeline_graph_people (company_id, project_id);

drop trigger if exists company_timeline_graph_people_set_updated_at
on public.company_timeline_graph_people;
create trigger company_timeline_graph_people_set_updated_at
  before update on public.company_timeline_graph_people
  for each row execute function public.set_updated_at();

alter table public.company_timeline_graph_people enable row level security;

drop policy if exists "company_timeline_graph_people deny client access"
on public.company_timeline_graph_people;
create policy "company_timeline_graph_people deny client access"
on public.company_timeline_graph_people
as restrictive
for all
to anon, authenticated
using (false)
with check (false);

with translations (translation_key, namespace, description, lv, en) as (
  values
    (
      'timeline_graph.field.people_count',
      'timeline_graph',
      'People working on a timeline graph section',
      'Cilvēki',
      'People'
    ),
    (
      'timeline_graph.people_count.decrease',
      'timeline_graph',
      'Decrease people count on timeline graph section',
      'Samazināt cilvēku skaitu',
      'Decrease people count'
    ),
    (
      'timeline_graph.people_count.increase',
      'timeline_graph',
      'Increase people count on timeline graph section',
      'Palielināt cilvēku skaitu',
      'Increase people count'
    ),
    (
      'timeline_graph.page.subtitle',
      'timeline_graph',
      'Timeline graph page subtitle',
      'Sakļauj projektu vienā rindā vai izvērs kategorijas un subkategorijas. Norādi cilvēku skaitu pie darba — grafiks saīsinās. Velc projektu, lai mainītu prioritāti.',
      'Collapse a project to one row, or expand categories and subcategories. Set people on a job — the bar shortens. Drag a project to change priority.'
    ),
    (
      'timeline_graph.page.subtitle_readonly',
      'timeline_graph',
      'Timeline graph subtitle when user cannot reorder',
      'Sakļauj projektu vienā rindā vai izvērs kategorijas un subkategorijas. Cilvēku skaits saīsina darba ilgumu grafikā.',
      'Collapse a project to one row, or expand categories and subcategories. People count shortens job duration on the graph.'
    ),
    (
      'errors.timeline_graph_people_count_invalid',
      'errors',
      'Invalid people count for timeline graph',
      'Nederīgs cilvēku skaits.',
      'Invalid people count.'
    ),
    (
      'errors.timeline_graph_people_count_save_failed',
      'errors',
      'Failed to save timeline graph people count',
      'Neizdevās saglabāt cilvēku skaitu.',
      'Failed to save people count.'
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
