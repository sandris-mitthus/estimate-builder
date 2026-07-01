with translations (translation_key, namespace, description, lv, en) as (
  values
    (
      'estimate.material_consumption.custom_volume',
      'estimate',
      'Material consumption toggle — use a different module volume than the position',
      'Cits apjoms',
      'Other volume'
    ),
    (
      'estimate.material_consumption.custom_volume_select',
      'estimate',
      'Select which module volume drives material consumption',
      'Patēriņa apjoms',
      'Consumption volume'
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
  values = excluded.values,
  updated_at = now();
