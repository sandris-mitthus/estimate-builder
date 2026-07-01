with translations (translation_key, namespace, description, lv, en) as (
  values
    (
      'estimate.material.position_unit_price',
      'estimate',
      'Material contribution label per position unit in position modal',
      'Uz pozīciju:',
      'Per position unit:'
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
