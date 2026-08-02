-- Seed sanitary room (sanmezgli) section translations for module project description and size summary.

with translations (translation_key, namespace, description, lv, en) as (
  values
    ('project_description.field.length_m', 'project_description', '', 'Garums (m)', 'Length (m)'),
    ('project_description.section.sanitary', 'project_description', '', 'Sanmezgli', 'Sanitary rooms'),
    ('project_description.sanitary.add', 'project_description', '', '+ Pievienot sanmezglu', '+ Add sanitary room'),
    ('project_description.sanitary.empty', 'project_description', '', 'Nav pievienotu sanmezglu.', 'No sanitary rooms added.'),
    ('project_description.sanitary.item', 'project_description', '', 'Sanmezgls {index}', 'Sanitary room {index}'),
    ('project_description.sanitary.delete', 'project_description', '', 'Dzēst sanmezglu {index}', 'Delete sanitary room {index}'),
    ('project_description.sanitary.name_placeholder', 'project_description', '', 'WC', 'WC'),
    ('project_description.sanitary.perimeter', 'project_description', '', 'Perimetrs', 'Perimeter'),
    ('project_description.sanitary.wall_area', 'project_description', '', 'Sienu laukums', 'Wall area'),
    ('project_description.sanitary.floor_area', 'project_description', '', 'Grīdas laukums', 'Floor area'),
    ('project_description.sanitary.total_perimeter', 'project_description', '', 'Sanmezglu kopējais perimetrs', 'Total sanitary room perimeter'),
    ('project_description.sanitary.total_wall_area', 'project_description', '', 'Sanmezglu kopējais sienu laukums', 'Total sanitary room wall area'),
    ('project_description.sanitary.total_floor_area', 'project_description', '', 'Sanmezglu kopējais grīdas laukums', 'Total sanitary room floor area'),
    ('project_description.summary.sanitary.item_name', 'project_description', '', '{room} — nosaukums', '{room} - name'),
    ('project_description.summary.sanitary.item_length', 'project_description', '', '{room} — garums (m)', '{room} - length (m)'),
    ('project_description.summary.sanitary.item_width', 'project_description', '', '{room} — platums (m)', '{room} - width (m)'),
    ('project_description.summary.sanitary.item_height', 'project_description', '', '{room} — augstums (m)', '{room} - height (m)'),
    ('project_description.summary.sanitary.item_perimeter', 'project_description', '', '{room} — perimetrs', '{room} - perimeter'),
    ('project_description.summary.sanitary.item_wall_area', 'project_description', '', '{room} — sienu laukums', '{room} - wall area'),
    ('project_description.summary.sanitary.item_floor_area', 'project_description', '', '{room} — grīdas laukums', '{room} - floor area')
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
