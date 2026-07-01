with translations (translation_key, namespace, description, lv, en) as (
  values
    (
      'positions.manual_unit.custom_label',
      'positions',
      'Manual unit custom text input label',
      'Cita mērvienība',
      'Other unit'
    ),
    (
      'positions.manual_unit.custom_placeholder',
      'positions',
      'Manual unit custom text input placeholder',
      'Ievadi savu mērvienību',
      'Enter your own unit'
    ),
    (
      'positions.manual_unit.custom_aria',
      'positions',
      'Manual unit custom text input aria label',
      'Ievadīt citu mērvienību',
      'Enter another unit'
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
