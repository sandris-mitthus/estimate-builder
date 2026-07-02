with translations (translation_key, namespace, description, lv, en) as (
  values
    (
      'estimate.sagatave.change_field.multi_note',
      'estimate',
      'Sagatave sync field: multi note',
      'Multi piezīme',
      'Multi note'
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
