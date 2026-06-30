with translations (translation_key, namespace, description, lv, en) as (
  values
    (
      'workers.actions.tools',
      'workers',
      'Worker row assigned tools action',
      'Piesaistītie instrumenti',
      'Assigned tools'
    ),
    (
      'workers.tools.title',
      'workers',
      'Worker assigned tools modal title',
      'Piesaistītie instrumenti',
      'Assigned tools'
    ),
    (
      'workers.tools.empty',
      'workers',
      'Worker has no assigned tools message',
      'Darbiniekam nav piesaistītu instrumentu.',
      'The worker has no assigned tools.'
    )
)
insert into public.site_translations (
  translation_key,
  namespace,
  description,
  values
)
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
