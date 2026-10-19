-- Choice on the banner when project volumes differ from the saved estimate.

with translations (translation_key, namespace, description, lv, en, ru) as (
  values
    (
      'estimate.module_size.quantities_refresh_available',
      'estimate',
      'Banner when project dimensions changed estimate quantities',
      'Projekta apjomi ir mainījušies. Vari atjaunot tāmes apjomus vai atstāt iepriekš saglabātos.',
      'Project volumes changed. You can update the estimate volumes or keep the previously saved ones.',
      'Объёмы проекта изменились. Можно обновить объёмы сметы или оставить ранее сохранённые.'
    ),
    (
      'estimate.module_size.quantities_refresh_apply',
      'estimate',
      'Apply changed project volumes to the estimate',
      'Atjaunot apjomus',
      'Update volumes',
      'Обновить объёмы'
    ),
    (
      'estimate.module_size.quantities_refresh_keep',
      'estimate',
      'Keep previously saved estimate volumes',
      'Atstāt vecos apjomus',
      'Keep previous volumes',
      'Оставить прежние объёмы'
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
