with translations (translation_key, namespace, description, lv, en) as (
  values
    (
      'estimate.material_consumption.pick_volume',
      'estimate',
      'Button to open modal and pick consumption volume',
      'Izvēlēt apjomu',
      'Choose volume'
    ),
    (
      'estimate.material_consumption.pick_volume_title',
      'estimate',
      'Modal title for picking material consumption volume',
      'Patēriņa apjoms',
      'Consumption volume'
    ),
    (
      'estimate.material_consumption.change_volume',
      'estimate',
      'Button to change already selected consumption volume',
      'Labot',
      'Change'
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
