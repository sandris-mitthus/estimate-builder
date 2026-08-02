-- Seed total perimeter labels for window and door types in module size summary.

with translations (translation_key, namespace, description, lv, en) as (
  values
    ('project_description.summary.windows.item_perimeter', 'project_description', '', 'Logu veids {index} — kopējais perimetrs', 'Window type {index} - total perimeter'),
    ('project_description.summary.doors.item_perimeter', 'project_description', '', 'Durvju veids {index} — kopējais perimetrs', 'Door type {index} - total perimeter')
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
