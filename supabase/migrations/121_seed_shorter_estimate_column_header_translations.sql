with translations (translation_key, namespace, description, lv, en) as (
  values
    (
      'estimate.unit_price_columns.labor_rate',
      'estimate',
      'Unit price subcolumn — labor hourly rate (short header)',
      'Likme',
      'Rate'
    ),
    (
      'estimate.unit_price_columns.labor_rate_currency',
      'estimate',
      'Unit price subcolumn — labor hourly rate with currency (short header)',
      'Likme {currency}/h',
      'Rate {currency}/h'
    ),
    (
      'estimate.volume_price_columns.workload',
      'estimate',
      'Volume price subcolumn — labor workload (short header)',
      'Darbietilpība',
      'Workload'
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
