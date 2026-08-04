-- Frontend module + nav: timeline graph (approved projects list scaffold).

insert into public.site_frontend_modules (module_key, is_enabled, sort_order)
values ('module_timeline_graph', false, 45)
on conflict (module_key) do nothing;

-- Default group nav permission for the new page.
update public.site_user_groups
set
  permissions = jsonb_set(permissions, '{nav,timeline_graph}', 'true'::jsonb, true),
  updated_at = now()
where slug in ('admin', 'viewer');

update public.company_user_groups
set
  permissions = jsonb_set(permissions, '{nav,timeline_graph}', 'true'::jsonb, true),
  updated_at = now()
where slug in ('admin', 'viewer')
  and is_system = true;

with translations (translation_key, namespace, description, lv, en) as (
  values
    (
      'nav.timeline',
      'navigation',
      'Existing Gantt schedule nav label (renamed to free Laika grafiks)',
      'Termiņu grafiks',
      'Schedule'
    ),
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
      'timeline_graph.page.subtitle',
      'timeline_graph',
      'Timeline graph page subtitle',
      'Apstiprinātie projekti. Papildu skats tiks veidots tālāk.',
      'Approved projects. Further views will be built later.'
    ),
    (
      'timeline_graph.empty',
      'timeline_graph',
      'Empty timeline graph message',
      'Nav apstiprinātu projektu.',
      'No approved projects.'
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
