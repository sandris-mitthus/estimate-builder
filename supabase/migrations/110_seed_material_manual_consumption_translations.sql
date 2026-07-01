with translations (translation_key, namespace, description, lv, en) as (
  values
    (
      'estimate.material_consumption.manual',
      'estimate',
      'Toggle to manually enter material consumption when units match',
      'Patēriņš',
      'Consumption'
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
