with translations (translation_key, namespace, description, lv, en) as (
  values
    (
      'additional_work.loading',
      'additional_work',
      'Loading overlay when opening an additional work estimate',
      'Ielādē papildu darbu tāmi…',
      'Loading additional work estimate…'
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
