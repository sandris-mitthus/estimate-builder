-- Rename public wiki-facing labels to documentation labels.

with translations (translation_key, namespace, description, lv, en) as (
  values
    (
      'auth.login.view_system_docs',
      'auth',
      'Login page link to public documentation',
      'Dokumentācija',
      'Documentation'
    ),
    (
      'wiki.docs.metadata.title',
      'wiki',
      'Public documentation metadata title',
      'Dokumentācija',
      'Documentation'
    ),
    (
      'wiki.docs.title',
      'wiki',
      'Public documentation sidebar title',
      'Dokumentācija',
      'Documentation'
    ),
    (
      'wiki.docs.nav.label',
      'wiki',
      'Public documentation navigation aria label',
      'Dokumentācijas sadaļas',
      'Documentation sections'
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
