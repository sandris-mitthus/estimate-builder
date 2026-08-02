-- Door size summary labels use index (Durvis 1) instead of module-specific mark.

with translations (translation_key, namespace, description, lv, en) as (
  values
    ('project_description.summary.doors.item_height', 'project_description', '', 'Durvis {index} — augstums (m)', 'Door {index} - height (m)'),
    ('project_description.summary.doors.item_width', 'project_description', '', 'Durvis {index} — platums (m)', 'Door {index} - width (m)'),
    ('project_description.summary.doors.item_count', 'project_description', '', 'Durvis {index} — skaits', 'Door {index} - count'),
    ('project_description.summary.doors.item_placement', 'project_description', '', 'Durvis {index} — vieta', 'Door {index} - placement'),
    ('project_description.summary.doors.item_area', 'project_description', '', 'Durvis {index} — laukums', 'Door {index} - area'),
    ('project_description.summary.doors.item_perimeter', 'project_description', '', 'Durvis {index} — kopējais perimetrs', 'Door {index} - total perimeter')
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
