-- Parallel group members modal translations.

with translations (translation_key, namespace, description, lv, en) as (
  values
    (
      'timeline_graph.parallel.modal.open',
      'timeline_graph',
      'Open parallel group members modal',
      'Rādīt sapārotās pozīcijas',
      'Show paired positions'
    ),
    (
      'timeline_graph.parallel.modal.description',
      'timeline_graph',
      'Parallel group modal description',
      'Šīs pozīcijas sākas vienlaikus tajā pašā projektā. Noņem, lai atkal ietu secīgi.',
      'These positions start together in the same project. Remove one to run sequentially again.'
    ),
    (
      'timeline_graph.parallel.modal.empty',
      'timeline_graph',
      'Empty parallel group modal',
      'Šajā grupā vairs nav sapārotu pozīciju.',
      'This group no longer has paired positions.'
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
