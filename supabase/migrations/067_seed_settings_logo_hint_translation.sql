-- Seed company settings logo hint translation.

with translations (translation_key, namespace, description, lv, en) as (
  values
    (
      'settings.logo_formats_hint',
      'settings',
      '',
      'PNG, JPG, WEBP vai SVG · max 2 MB',
      'PNG, JPG, WEBP, or SVG · max 2 MB'
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
