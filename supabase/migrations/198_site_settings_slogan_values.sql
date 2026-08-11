-- Localized system slogan (per site language) + anonymous geo-language docs in UI copy.

alter table public.site_settings
  add column if not exists slogan_values jsonb not null default '{}'::jsonb;

update public.site_settings
set slogan_values = jsonb_build_object(
  'lv', coalesce(nullif(trim(slogan), ''), 'Tāmes piedāvājumu veidošana'),
  'en', 'Building estimate offers'
)
where slogan_values = '{}'::jsonb
   or slogan_values is null
   or not (slogan_values ? 'lv');

update public.site_settings
set slogan_values = slogan_values || jsonb_build_object('en', 'Building estimate offers')
where coalesce(slogan_values->>'en', '') = '';

with translations (translation_key, namespace, description, lv, en) as (
  values
    (
      'site_settings.form.slogan_hint',
      'site_settings',
      'Hint under localized slogan fields',
      'Norādi sloganu katrai sistēmas valodai. Landing un metadati izmanto aktīvās valodas tekstu.',
      'Enter a slogan for each system language. Landing and metadata use the active language text.'
    ),
    (
      'site_settings.validation.slogan_required',
      'site_settings',
      'At least one slogan language value is required',
      'Ievadi sistēmas sloganu vismaz vienā valodā.',
      'Enter a system slogan in at least one language.'
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
