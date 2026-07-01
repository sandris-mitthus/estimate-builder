with translations (translation_key, namespace, description, lv, en) as (
  values
    (
      'estimate.drag.material',
      'estimate',
      'Material row drag handle aria label',
      'Pārvietot materiālu: {name}',
      'Move material: {name}'
    ),
    (
      'estimate.drag.mechanism',
      'estimate',
      'Mechanism row drag handle aria label',
      'Pārvietot mehānismu: {name}',
      'Move mechanism: {name}'
    )
)
insert into public.site_translations (
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
  values = excluded.values;
