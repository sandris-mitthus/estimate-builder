-- Sagatave sync: new multi-position option added in template.

with translations (translation_key, namespace, description, lv, en, ru) as (
  values
    (
      'estimate.sagatave.change_field.multi_option_add',
      'estimate',
      'Sagatave sync field: new multi option',
      'Jauna multi izvēle',
      'New multi option',
      'Новый вариант multi'
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
