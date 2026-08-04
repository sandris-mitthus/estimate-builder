-- Module copy UI + error translations.

with translations (translation_key, namespace, description, lv, en) as (
  values
    (
      'modules.copy.title',
      'modules',
      'Copy building module modal title',
      'Kopēt moduli',
      'Copy module'
    ),
    (
      'modules.copy.description',
      'modules',
      'Copy building module modal description',
      'Ievadi jaunā moduļa nosaukumu. Dati tiks nokopēti no izvēlētā moduļa.',
      'Enter the new module name. Data will be copied from the selected module.'
    ),
    (
      'actions.copying',
      'common',
      'Busy label while copying',
      'Kopē…',
      'Copying...'
    ),
    (
      'errors.module_copy_failed',
      'errors',
      'Failed to copy building module',
      'Neizdevās nokopēt moduli.',
      'Failed to copy module.'
    ),
    (
      'errors.module_files_copy_failed',
      'errors',
      'Failed to copy building module asset files',
      'Neizdevās nokopēt moduļa failus.',
      'Failed to copy module files.'
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
