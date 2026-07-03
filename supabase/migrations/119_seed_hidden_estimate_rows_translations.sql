with translations (translation_key, namespace, description, lv, en) as (
  values
    (
      'estimate.hidden.show',
      'estimate',
      'Toggle to reveal soft-deleted estimate rows in project editor',
      'Rādīt noņemtās ({count})',
      'Show removed ({count})'
    ),
    (
      'estimate.hidden.hide',
      'estimate',
      'Toggle to hide soft-deleted estimate rows again',
      'Paslēpt noņemtās',
      'Hide removed'
    ),
    (
      'estimate.hidden.restore',
      'estimate',
      'Restore a soft-deleted estimate row in project editor',
      'Atjaunot pozīciju',
      'Restore position'
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
