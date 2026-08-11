-- Fix timeline graph subtitle keys for cross-project sync copy (203 used wrong key).

with translations (translation_key, namespace, description, lv, en) as (
  values
    (
      'timeline_graph.parallel.feedback.paired',
      'timeline_graph',
      'Toast after pairing parallel works',
      'Sapāroti paralēli. Tādi paši darbi citos projektos arī sasaitīti.',
      'Paired in parallel. Matching works in other projects were linked too.'
    ),
    (
      'timeline_graph.page.subtitle',
      'timeline_graph',
      'Timeline graph page subtitle',
      'Sakļauj projektu vienā rindā vai izvērs kategorijas un subkategorijas. Cilvēku skaits un paralēlā sasaistīšana pēc nosaukuma sinhronizējas starp projektiem. Velc darbu uz citu darbu tajā pašā projektā, lai ietu paralēli. Velc projektu, lai mainītu prioritāti.',
      'Collapse a project to one row, or expand categories and subcategories. People count and parallel linking sync across projects by name. Drag a job onto another in the same project to run in parallel. Drag a project to change priority.'
    ),
    (
      'timeline_graph.page.subtitle_readonly',
      'timeline_graph',
      'Timeline graph subtitle when user cannot reorder',
      'Sakļauj projektu vienā rindā vai izvērs kategorijas un subkategorijas. Cilvēku skaits un paralēlā sasaistīšana pēc nosaukuma sinhronizējas starp projektiem.',
      'Collapse a project to one row, or expand categories and subcategories. People count and parallel linking sync across projects by name.'
    )
)
insert into public.site_translations as t (
  translation_key,
  namespace,
  description,
  values
)
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
  values = t.values || excluded.values,
  updated_at = now();
