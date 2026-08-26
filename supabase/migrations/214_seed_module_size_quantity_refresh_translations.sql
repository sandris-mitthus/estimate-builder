-- Banner when project/module dimensions change and estimate quantities were refreshed.

with translations (translation_key, namespace, description, lv, en, ru) as (
  values
    (
      'estimate.module_size.quantities_refresh_available',
      'estimate',
      'Banner when project dimensions changed estimate quantities',
      'Projekta apjomi ir mainījušies — tāme ir atjaunināta. Saglabā, lai izmaiņas paliktu.',
      'Project volumes changed — the estimate was updated. Save to keep the changes.',
      'Объёмы проекта изменились — смета обновлена. Сохраните, чтобы изменения остались.'
    ),
    (
      'estimate.module_size.quantities_refresh_dismiss',
      'estimate',
      'Dismiss module size quantity refresh banner',
      'Sapratu',
      'Got it',
      'Понятно'
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
