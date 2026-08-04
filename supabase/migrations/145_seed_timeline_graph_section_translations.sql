-- Timeline graph category / subcategory breakdown labels.

with translations (translation_key, namespace, description, lv, en) as (
  values
    (
      'timeline_graph.page.subtitle',
      'timeline_graph',
      'Timeline graph page subtitle',
      'Kalendārs sadalīts pa tāmes kategorijām un subkategorijām. Neapstiprinātie projekti rādās blāvi; velc projektu, lai mainītu prioritāti.',
      'Calendar split by estimate categories and subcategories. Unapproved projects appear muted; drag a project to change priority.'
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
