-- Translations for Resend encryption gate, SVG disallow, worker ownership.

with translations (translation_key, namespace, description, lv, en) as (
  values
    (
      'site_integrations.resend.validation.encryption_key_required',
      'site_integrations',
      'Require SECRETS_ENCRYPTION_KEY when storing Resend API key in DB',
      'Lai glabātu Resend atslēgu DB, iestati SECRETS_ENCRYPTION_KEY (vai izmanto RESEND_API_KEY vidē).',
      'To store a Resend API key in the DB, set SECRETS_ENCRYPTION_KEY (or use RESEND_API_KEY in the environment).'
    ),
    (
      'errors.svg_not_allowed',
      'errors',
      'SVG uploads rejected for XSS hardening',
      'SVG fails nav atļauts.',
      'SVG files are not allowed.'
    ),
    (
      'errors.worker_not_found',
      'errors',
      'Worker missing or not in current company',
      'Darbinieks nav atrasts.',
      'Worker not found.'
    )
)
insert into public.site_translations as t (
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
  values = t.values || excluded.values,
  updated_at = now();
