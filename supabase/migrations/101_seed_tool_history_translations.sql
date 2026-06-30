with translations (translation_key, namespace, description, lv, en) as (
  values
    (
      'tools.actions.history',
      'tools',
      'Tool history action',
      'Instrumenta vēsture',
      'Tool history'
    ),
    (
      'tools.history.title',
      'tools',
      'Tool history modal title',
      'Instrumenta vēsture',
      'Tool history'
    ),
    (
      'tools.history.loading',
      'tools',
      'Tool history loading message',
      'Ielādē vēsturi…',
      'Loading history…'
    ),
    (
      'tools.history.assigned_to_worker',
      'tools',
      'Tool history assigned to worker label',
      'Piesaistīts darbiniekam',
      'Assigned to worker'
    ),
    (
      'tools.history.empty',
      'tools',
      'Empty tool history message',
      'Instrumentam vēl nav piesaistes vēstures.',
      'This tool has no assignment history yet.'
    ),
    (
      'errors.tool_history_load_failed',
      'errors',
      'Tool history load failed error',
      'Neizdevās ielādēt instrumenta vēsturi.',
      'Failed to load tool history.'
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
