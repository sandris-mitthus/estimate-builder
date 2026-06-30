with translations (translation_key, namespace, description, lv, en) as (
  values
    (
      'tools.actions.assign_worker',
      'tools',
      'Assign tool to worker action',
      'Piesaistīt darbiniekam',
      'Assign to worker'
    ),
    (
      'tools.assign_worker.title',
      'tools',
      'Assign tool to worker modal title',
      'Piesaistīt darbiniekam',
      'Assign to worker'
    ),
    (
      'tools.assign_worker.search_label',
      'tools',
      'Assign tool worker search label',
      'Darbinieks',
      'Worker'
    ),
    (
      'tools.assign_worker.search_placeholder',
      'tools',
      'Assign tool worker search placeholder',
      'Meklē pēc vārda vai uzvārda',
      'Search by first or last name'
    ),
    (
      'tools.assign_worker.current',
      'tools',
      'Currently assigned worker marker',
      'Piesaistīts',
      'Assigned'
    ),
    (
      'tools.assign_worker.no_workers',
      'tools',
      'No workers available to assign',
      'Nav pievienots neviens darbinieks.',
      'No workers have been added.'
    ),
    (
      'tools.assign_worker.assign_first',
      'tools',
      'Assign first worker action',
      'Piesaistīt pirmo',
      'Assign first'
    ),
    (
      'tools.feedback.assigned_worker',
      'tools',
      'Tool assigned to worker feedback',
      'Instruments piesaistīts darbiniekam.',
      'Tool assigned to worker.'
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
