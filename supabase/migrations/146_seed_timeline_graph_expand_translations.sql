-- Expand / collapse subcategory rows on timeline graph.

with translations (translation_key, namespace, description, lv, en) as (
  values
    (
      'timeline_graph.page.subtitle',
      'timeline_graph',
      'Timeline graph page subtitle',
      'Sākumā redzamas kategorijas; ar bultiņu izvērs subkategorijas. Velc projektu, lai mainītu prioritāti.',
      'Categories are shown first; expand with the arrow to see subcategories. Drag a project to change priority.'
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
