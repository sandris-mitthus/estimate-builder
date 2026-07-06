with translations (translation_key, namespace, description, lv, en) as (
  values
    (
      'estimate.sagatave.change_field.show_only_total_price',
      'estimate',
      'Sagatave sync modal field label for show only total price flag',
      'Rādīt tikai gala summu',
      'Show only final total'
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
  values = excluded.values,
  updated_at = now();
