-- Module data is complete only with viz + project files + living area.

drop index if exists public.building_modules_company_id_completion_idx;

alter table public.building_modules
  drop column if exists module_data_complete;

alter table public.building_modules
  add column module_data_complete boolean
  generated always as (
    (
      case
        when jsonb_typeof(visualization_blocks) = 'array'
          then jsonb_array_length(visualization_blocks)
        else 0
      end
    ) > 0
    and
    (
      case
        when jsonb_typeof(project_blocks) = 'array'
          then jsonb_array_length(project_blocks)
        else 0
      end
    ) > 0
    and
    nullif(btrim(coalesce(project_description->>'livingAreaM2', '')), '') is not null
  ) stored;

create index if not exists building_modules_company_id_completion_idx
on public.building_modules (company_id, module_data_complete);

-- Incomplete-data warning texts now include living area.

with translations (translation_key, namespace, description, lv, en) as (
  values
    (
      'modules.data_missing',
      'modules',
      'Missing module data warning (files or living area)',
      'Nav ievadīti moduļu dati',
      'Module data is missing'
    ),
    (
      'modules.nav.incomplete_warning',
      'modules',
      'Sidebar warning when some modules lack files or living area',
      'Dažiem moduļiem trūkst vizualizāciju, projekta failu vai dzīvojamās platības',
      'Some modules are missing visualizations, project files, or living area'
    ),
    (
      'project_description.validation.living_area_required',
      'project_description',
      'Living area field missing warning',
      'Ievadi dzīvojamo platību.',
      'Enter the living area.'
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
