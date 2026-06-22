-- Seed translated export filename prefixes.

with translations (translation_key, namespace, description, lv, en) as (
  values
    (
      'exports.filename.offer',
      'exports',
      'ASCII-safe PDF offer filename prefix',
      'piedavajums',
      'offer'
    ),
    (
      'exports.filename.estimate',
      'exports',
      'ASCII-safe Excel estimate filename prefix',
      'tame',
      'estimate'
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
