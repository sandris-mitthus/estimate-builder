-- Subtitle copy for parallel work pairing on timeline graph.

with translations (translation_key, namespace, description, lv, en) as (
  values
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
