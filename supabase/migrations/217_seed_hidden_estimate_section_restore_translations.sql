-- Soft-delete restore tooltip covers positions, categories and subcategories.

with translations (translation_key, namespace, description, lv, en, ru) as (
  values
    (
      'estimate.hidden.restore',
      'estimate',
      'Restore a soft-deleted estimate row, category or subcategory in project editor',
      'Atjaunot',
      'Restore',
      'Восстановить'
    )
)
insert into public.site_translations (translation_key, namespace, description, values)
select
  translation_key,
  namespace,
  description,
  jsonb_build_object('lv', lv, 'en', en, 'ru', ru)
from translations
on conflict (translation_key) do update
set
  namespace = excluded.namespace,
  description = excluded.description,
  values = public.site_translations.values || excluded.values,
  updated_at = now();
