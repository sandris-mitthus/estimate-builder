-- Restore Laika grafiks (module_timeline_graph) after accidental removal in 153.
-- Frontend code was never deleted; only DB module/table/permissions/translations were.

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

insert into public.site_frontend_modules (module_key, is_enabled, sort_order)
values ('module_timeline_graph', false, 45)
on conflict (module_key) do update
set
  sort_order = excluded.sort_order,
  updated_at = now();

update public.site_user_groups
set
  permissions = jsonb_set(
    jsonb_set(permissions, '{nav,timeline_graph}', 'true'::jsonb, true),
    '{actions,timeline_graph.manage}',
    case when slug = 'admin' then 'true'::jsonb else 'false'::jsonb end,
    true
  ),
  updated_at = now()
where slug in ('admin', 'viewer');

update public.company_user_groups
set
  permissions = jsonb_set(
    jsonb_set(permissions, '{nav,timeline_graph}', 'true'::jsonb, true),
    '{actions,timeline_graph.manage}',
    case when slug = 'admin' then 'true'::jsonb else 'false'::jsonb end,
    true
  ),
  updated_at = now()
where slug in ('admin', 'viewer')
  and is_system = true;

update public.company_user_groups
set
  permissions = jsonb_set(
    jsonb_set(permissions, '{nav,timeline_graph}', 'true'::jsonb, true),
    '{actions,timeline_graph.manage}',
    'false'::jsonb,
    true
  ),
  updated_at = now()
where is_system = false
  and permissions #> '{nav,timeline_graph}' is null;

with translations (translation_key, namespace, description, lv, en) as (
  values
    (
      'nav.timeline_graph',
      'navigation',
      'Timeline graph navigation label',
      'Laika grafiks',
      'Timeline graph'
    ),
    (
      'permissions.nav.timeline_graph',
      'permissions',
      'Timeline graph nav permission label',
      'Laika grafiks',
      'Timeline graph'
    ),
    (
      'permissions.actions.timeline_graph.manage',
      'permissions',
      'Change timeline graph project priority order',
      'Mainīt laika grafika prioritāti',
      'Change timeline graph priority'
    ),
    (
      'timeline_graph.page.subtitle',
      'timeline_graph',
      'Timeline graph page subtitle',
      'Sakļauj projektu vienā rindā vai izvērs kategorijas un subkategorijas. Velc projektu, lai mainītu prioritāti.',
      'Collapse a project to one row, or expand categories and subcategories. Drag a project to change priority.'
    ),
    (
      'timeline_graph.page.subtitle_readonly',
      'timeline_graph',
      'Timeline graph subtitle when user cannot reorder',
      'Sakļauj projektu vienā rindā vai izvērs kategorijas un subkategorijas.',
      'Collapse a project to one row, or expand categories and subcategories.'
    ),
    (
      'timeline_graph.empty',
      'timeline_graph',
      'Empty timeline graph message',
      'Nav projektu laika grafikā.',
      'No projects on the timeline graph.'
    ),
    (
      'timeline_graph.column.project',
      'timeline_graph',
      'Project column header',
      'Projekts',
      'Project'
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
      'timeline_graph.hours_per_day_hint',
      'timeline_graph',
      'Explains workday hours and that weekends are skipped',
      'Brīvdienas netiek ieskaitītas · 1 d = {hours} c/h',
      'Weekends are excluded · 1 d = {hours} man-hours'
    ),
    (
      'timeline_graph.bar_range',
      'timeline_graph',
      'Scheduled bar date range tooltip',
      '{start} — {end}',
      '{start} — {end}'
    ),
    (
      'timeline_graph.legend.confirmed',
      'timeline_graph',
      'Legend for approved/completed projects',
      'Apstiprināts',
      'Approved'
    ),
    (
      'timeline_graph.legend.unconfirmed',
      'timeline_graph',
      'Legend for active unapproved projects',
      'Nav apstiprināts (aptuveni)',
      'Not approved (estimate)'
    ),
    (
      'timeline_graph.legend.category',
      'timeline_graph',
      'Legend for category rows',
      'Kategorija',
      'Category'
    ),
    (
      'timeline_graph.legend.subcategory',
      'timeline_graph',
      'Legend for subcategory rows',
      'Subkategorija',
      'Subcategory'
    ),
    (
      'timeline_graph.status.unconfirmed',
      'timeline_graph',
      'Unconfirmed project approximate ready date',
      'Nav apstiprināts · aptuveni līdz {date}',
      'Not approved · approx. until {date}'
    ),
    (
      'timeline_graph.expand',
      'timeline_graph',
      'Expand category subcategories',
      'Izvērst subkategorijas',
      'Expand subcategories'
    ),
    (
      'timeline_graph.collapse',
      'timeline_graph',
      'Collapse category subcategories',
      'Sakļaut subkategorijas',
      'Collapse subcategories'
    ),
    (
      'timeline_graph.direct_positions',
      'timeline_graph',
      'Direct category-level positions row label',
      'Pozīcijas',
      'Positions'
    ),
    (
      'timeline_graph.collapse_project',
      'timeline_graph',
      'Aria label to collapse project categories',
      'Sakļaut projektu',
      'Collapse project'
    ),
    (
      'timeline_graph.expand_project',
      'timeline_graph',
      'Aria label to expand project categories',
      'Izvērst projektu',
      'Expand project'
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
