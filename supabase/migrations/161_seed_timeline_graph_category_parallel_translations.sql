-- Category-level parallel pairing copy (same project only).

with translations (translation_key, namespace, description, lv, en) as (
  values
    (
      'timeline_graph.parallel.drag',
      'timeline_graph',
      'Drag handle for pairing timeline graph works in parallel',
      'Velc uz citu kategoriju vai darbu tajā pašā projektā, lai sāktos paralēli',
      'Drag onto another category or job in the same project to start in parallel'
    ),
    (
      'timeline_graph.parallel.drop_hint',
      'timeline_graph',
      'Drop target hint for parallel pairing',
      'Nomej šeit, lai sāktos paralēli (tikai šajā projektā)',
      'Drop here to start in parallel (same project only)'
    ),
    (
      'timeline_graph.parallel.feedback.paired',
      'timeline_graph',
      'Toast after pairing works in parallel',
      'Sapāroti paralēli tajā pašā projektā.',
      'Paired to run in parallel in the same project.'
    ),
    (
      'errors.timeline_graph_parallel_invalid',
      'errors',
      'Invalid timeline graph parallel pair',
      'Nevar sapārot šos darbus.',
      'These jobs cannot be paired.'
    ),
    (
      'errors.timeline_graph_parallel_cross_project',
      'errors',
      'Cannot pair timeline graph works across projects',
      'Nevar sapārot ar citu projektu — paralēli tikai tajā pašā projektā.',
      'Cannot pair with another project — parallel only within the same project.'
    ),
    (
      'timeline_graph.page.subtitle',
      'timeline_graph',
      'Timeline graph page subtitle',
      'Sakļauj projektu vienā rindā vai izvērs kategorijas. Velc kategoriju vai darbu uz citu tajā pašā projektā, lai sāktos paralēli (ne ar citu projektu). Norādi cilvēku skaitu — grafiks saīsinās. Velc projektu, lai mainītu prioritāti.',
      'Collapse a project to one row, or expand categories. Drag a category or job onto another in the same project to start in parallel (not across projects). Set people — the bar shortens. Drag a project to change priority.'
    ),
    (
      'timeline_graph.page.subtitle_readonly',
      'timeline_graph',
      'Timeline graph subtitle when user cannot reorder',
      'Sakļauj projektu vienā rindā vai izvērs kategorijas. Cilvēku skaits saīsina ilgumu; sapāroti darbi vienā projektā iet paralēli.',
      'Collapse a project to one row, or expand categories. People count shortens duration; paired jobs in one project run in parallel.'
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
