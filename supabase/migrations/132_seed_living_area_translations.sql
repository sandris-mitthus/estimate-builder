-- Seed living area field for module project description foundation section.

with translations (translation_key, namespace, description, lv, en) as (
  values
    ('project_description.field.living_area_m2', 'project_description', '', 'Dzīvojamā platība (m²)', 'Living area (m²)'),
    ('project_description.summary.foundation.living_area', 'project_description', '', 'Dzīvojamā platība (m²)', 'Living area (m²)')
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
