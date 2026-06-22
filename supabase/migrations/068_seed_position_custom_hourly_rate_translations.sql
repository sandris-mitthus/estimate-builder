-- Seed position custom hourly rate translations.

with translations (translation_key, namespace, description, lv, en) as (
  values
    (
      'positions.custom_hourly_rate.enabled_label',
      'positions',
      '',
      'Individuāla stundas likme',
      'Custom hourly rate'
    ),
    (
      'positions.custom_hourly_rate.rate_label',
      'positions',
      '',
      'Stundas likme',
      'Hourly rate'
    ),
    (
      'positions.custom_hourly_rate.aria',
      'positions',
      '',
      'Individuālā stundas likme',
      'Custom hourly rate'
    ),
    (
      'positions.custom_hourly_rate.default_hint',
      'positions',
      '',
      'Izmanto noklusējuma likmi {rate} €/h',
      'Uses default rate {rate} €/h'
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
