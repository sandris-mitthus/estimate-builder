-- Sidebar warning when some building modules are missing viz/PDF data.

with translations (translation_key, namespace, description, lv, en) as (
  values
    (
      'modules.nav.incomplete_warning',
      'modules',
      'Sidebar warning when some modules lack visualization or project files',
      'Dažiem moduļiem trūkst vizualizāciju vai projekta failu',
      'Some modules are missing visualizations or project files'
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
