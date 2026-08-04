with translations (translation_key, namespace, description, lv, en) as (
  values
    (
      'nav.group.estimate',
      'navigation',
      'Sidebar group label for estimate-related links',
      'Tāme',
      'Estimate'
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
