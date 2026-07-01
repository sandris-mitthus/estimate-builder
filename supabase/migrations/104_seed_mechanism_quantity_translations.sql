with translations (translation_key, namespace, description, lv, en) as (
  values
    (
      'estimate.mechanism_quantity.aria',
      'estimate',
      'Mechanism quantity input aria label',
      'Mehānisma daudzums {unit}',
      'Mechanism quantity {unit}'
    ),
    (
      'estimate.mechanism_quantity.fixed_on',
      'estimate',
      'Mechanism fixed quantity switch enabled label',
      'Fiksēts daudzums',
      'Fixed quantity'
    ),
    (
      'estimate.mechanism_quantity.fixed_off',
      'estimate',
      'Mechanism fixed quantity switch disabled label',
      'Pēc laika normas',
      'By time norm'
    ),
    (
      'estimate.mechanism_quantity.fixed_aria',
      'estimate',
      'Mechanism fixed quantity switch aria label',
      'Izmantot tikai definēto mehānisma daudzumu',
      'Use only the defined mechanism quantity'
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
