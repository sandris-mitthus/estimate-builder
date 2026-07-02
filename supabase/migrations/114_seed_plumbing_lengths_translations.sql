-- Seed plumbing length fields for module project description.

with translations (translation_key, namespace, description, lv, en) as (
  values
    ('project_description.section.plumbing', 'project_description', '', 'Ūdensapgāde', 'Plumbing'),
    ('project_description.field.cold_water_length_m', 'project_description', '', 'Aukstā ūdens garums (m)', 'Cold water length (m)'),
    ('project_description.field.hot_water_length_m', 'project_description', '', 'Karstā ūdens garums (m)', 'Hot water length (m)'),
    ('project_description.field.recirculation_length_m', 'project_description', '', 'Recirkulācijas garums (m)', 'Recirculation length (m)'),
    ('project_description.summary.plumbing.title', 'project_description', '', 'Ūdensapgāde', 'Plumbing'),
    ('project_description.summary.plumbing.cold_water', 'project_description', '', 'Aukstā ūdens garums (m)', 'Cold water length (m)'),
    ('project_description.summary.plumbing.hot_water', 'project_description', '', 'Karstā ūdens garums (m)', 'Hot water length (m)'),
    ('project_description.summary.plumbing.recirculation', 'project_description', '', 'Recirkulācijas garums (m)', 'Recirculation length (m)')
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
