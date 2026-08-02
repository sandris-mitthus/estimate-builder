-- Seed ×2 quantity multiplier hint for module size attachment (both wall sides).

with translations (translation_key, namespace, description, lv, en) as (
  values
    (
      'modules.sizes.double_quantity_hint',
      'modules',
      '',
      'Reizināt ar 2 (abām pusēm)',
      'Multiply by 2 (both sides)'
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
