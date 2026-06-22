-- Seed position modal translations and currency-aware labels.

with translations (translation_key, namespace, description, lv, en) as (
  values
    (
      'positions.modal.title',
      'positions',
      '',
      'Pozīcija',
      'Position'
    ),
    (
      'positions.modal.description',
      'positions',
      '',
      'Definē nosaukumu, apjomu, laika normu, materiālus un mehānismus.',
      'Define the name, quantity, time norm, materials, and mechanisms.'
    ),
    (
      'positions.modal.name_placeholder',
      'positions',
      '',
      'piem. Sienas mūrēšana',
      'e.g. wall masonry'
    ),
    (
      'estimate.labor_rate_display',
      'estimate',
      '',
      'Darbs = {rate} {currency}/h',
      'Labor = {rate} {currency}/h'
    ),
    (
      'positions.custom_hourly_rate.default_hint',
      'positions',
      '',
      'Izmanto noklusējuma likmi {rate} {currency}/h',
      'Uses default rate {rate} {currency}/h'
    ),
    (
      'estimate.column.total_eur',
      'estimate',
      '',
      'Kopā {currency}',
      'Total {currency}'
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
