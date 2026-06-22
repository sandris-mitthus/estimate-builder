with translations (translation_key, namespace, description, lv, en) as (
  values
    ('project_description.field.mark', 'project_description', '', 'Marka', 'Mark'),
    ('project_description.summary.windows.item_mark', 'project_description', '', 'Logu veids {index} — marka', 'Window type {index} - mark'),
    ('project_description.summary.doors.item_mark', 'project_description', '', 'Durvju veids {index} — marka', 'Door type {index} - mark')
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
