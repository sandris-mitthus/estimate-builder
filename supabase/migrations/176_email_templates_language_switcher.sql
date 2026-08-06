-- Email templates UI: language switcher labels.

with translations (translation_key, namespace, description, lv, en) as (
  values
    (
      'site_email_templates.language.switcher',
      'site_email_templates',
      'Language switcher label on email templates',
      'Valoda',
      'Language'
    ),
    (
      'site_email_templates.language.inactive',
      'site_email_templates',
      'Badge for inactive system language on email templates',
      'Neaktīva',
      'Inactive'
    ),
    (
      'site_email_templates.templates.section_hint',
      'site_email_templates',
      'Templates section hint',
      'Teksti ir katrā sistēmas valodā — pārslēdz valodu, lai rediģētu un apskatītu. Parametri: {name}, {company}, {system}; HTML pogai {link}.',
      'Copy exists for every system language — switch language to edit and preview. Placeholders: {name}, {company}, {system}; HTML button uses {link}.'
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
