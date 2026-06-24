-- Seed public docs article view translations.

with translations (translation_key, namespace, description, lv, en) as (
  values
    (
      'wiki.docs.index.title',
      'wiki',
      'Public docs default index heading',
      'Dokumentācijas sadaļas',
      'Documentation sections'
    ),
    (
      'wiki.docs.index.subtitle',
      'wiki',
      'Public docs default index subtitle',
      'Izvēlies kategoriju vai docs rakstu, lai atvērtu detalizētu saturu.',
      'Choose a category or docs article to open detailed content.'
    ),
    (
      'wiki.docs.article.back_to_list',
      'wiki',
      'Public docs article back to list button',
      'Atpakaļ uz docs sarakstu',
      'Back to docs list'
    ),
    (
      'wiki.docs.article.open',
      'wiki',
      'Public docs card screen-reader open article label',
      'Atvērt docs rakstu',
      'Open docs article'
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
