-- Window size summary uses index labels; add showcase (vitrīna) toggle texts.

with translations (translation_key, namespace, description, lv, en) as (
  values
    ('project_description.windows.showcase', 'project_description', '', 'Vitrīna (īpašas stikla durvis)', 'Showcase (special glass doors)'),
    ('project_description.summary.windows.item_height', 'project_description', '', 'Logi {index} — augstums (m)', 'Window {index} - height (m)'),
    ('project_description.summary.windows.item_width', 'project_description', '', 'Logi {index} — platums (m)', 'Window {index} - width (m)'),
    ('project_description.summary.windows.item_count', 'project_description', '', 'Logi {index} — skaits', 'Window {index} - count'),
    ('project_description.summary.windows.item_type', 'project_description', '', 'Logi {index} — tips', 'Window {index} - type'),
    ('project_description.summary.windows.item_area', 'project_description', '', 'Logi {index} — laukums', 'Window {index} - area'),
    ('project_description.summary.windows.item_perimeter', 'project_description', '', 'Logi {index} — kopējais perimetrs', 'Window {index} - total perimeter'),
    ('project_description.summary.windows.showcase', 'project_description', '', 'Vitrīna', 'Showcase'),
    ('project_description.summary.windows.regular', 'project_description', '', 'Logs', 'Window')
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
