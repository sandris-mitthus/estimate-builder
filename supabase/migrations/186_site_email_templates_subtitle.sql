-- Resend configuration now lives in /site_integrations, so the email templates
-- page no longer describes itself as the place to set up the integration.

with translations (translation_key, namespace, description, lv, en) as (
  values
    (
      'site_email_templates.page.subtitle',
      'site_email_templates',
      'Email templates page subtitle',
      'E-pastu teksti, kas tiek sūtīti lietotājiem',
      'The email copy sent to users'
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
