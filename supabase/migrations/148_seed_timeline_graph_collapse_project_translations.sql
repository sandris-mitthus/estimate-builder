-- Timeline graph: collapse/expand project rows.

with translations (translation_key, namespace, description, lv, en) as (
  values
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
      'timeline_graph.page.subtitle',
      'timeline_graph',
      'Timeline graph page subtitle',
      'Sakļauj projektu vienā rindā vai izvērs kategorijas un subkategorijas. Velc projektu, lai mainītu prioritāti.',
      'Collapse a project to one row, or expand categories and subcategories. Drag a project to change priority.'
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
