with translations (translation_key, namespace, description, lv, en) as (
  values
    (
      'workers.photo.uploading_title',
      'workers',
      'Worker photo upload modal title',
      'Foto tiek ielādēts',
      'Uploading photo'
    ),
    (
      'workers.photo.uploading_description',
      'workers',
      'Worker photo upload modal description',
      'Lūdzu, uzgaidi nedaudz, kamēr augšupielāde pabeidzas.',
      'Please wait a moment while the upload finishes.'
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
