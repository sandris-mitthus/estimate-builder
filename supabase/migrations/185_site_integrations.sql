-- System admin integrations hub: toggle and configure integrations in one place.
-- First two integrations: the public landing page and Resend.

alter table public.site_settings
  add column if not exists landing_enabled boolean not null default true;

-- Resend configuration moved from /site_email_templates to /site_integrations,
-- so its translation keys move with it instead of being duplicated.
insert into public.site_translations (translation_key, namespace, description, values)
select
  replace(
    translation_key,
    'site_email_templates.resend.',
    'site_integrations.resend.'
  ),
  'site_integrations',
  description,
  values
from public.site_translations
where translation_key like 'site_email_templates.resend.%'
on conflict (translation_key) do update
set
  namespace = excluded.namespace,
  description = excluded.description,
  values = public.site_translations.values || excluded.values,
  updated_at = now();

delete from public.site_translations
where translation_key like 'site_email_templates.resend.%';

with translations (translation_key, namespace, description, lv, en) as (
  values
    (
      'nav.system_admin.site_integrations',
      'nav',
      'System admin sidebar link to the integrations page',
      'Integrācijas',
      'Integrations'
    ),
    (
      'site_integrations.page.subtitle',
      'site_integrations',
      'Integrations page subtitle',
      'Ieslēdz, izslēdz un konfigurē sistēmas integrācijas',
      'Enable, disable and configure system integrations'
    ),
    (
      'status.enabled',
      'status',
      'Generic enabled status label',
      'Ieslēgts',
      'Enabled'
    ),
    (
      'status.disabled',
      'status',
      'Generic disabled status label',
      'Izslēgts',
      'Disabled'
    ),
    (
      'site_integrations.landing.section',
      'site_integrations',
      'Landing page integration card title',
      'Landing page',
      'Landing page'
    ),
    (
      'site_integrations.landing.section_hint',
      'site_integrations',
      'Landing page integration card explanation',
      'Publiskā sākumlapa anonīmiem apmeklētājiem ar produkta aprakstu un saitēm uz pierakstīšanos. Kad izslēgts, apmeklētājs uzreiz nonāk pierakstīšanās lapā.',
      'The public home page for anonymous visitors, describing the product and linking to sign in. When disabled, visitors go straight to the sign-in page.'
    ),
    (
      'site_integrations.landing.enabled',
      'site_integrations',
      'Landing page enable toggle label',
      'Ieslēgt landing page',
      'Enable landing page'
    ),
    (
      'site_integrations.landing.texts_hint',
      'site_integrations',
      'Where to edit landing page copy',
      'Landing page tekstus labo sadaļā Tulkojumi — atslēgas sākas ar landing.',
      'Landing page copy is edited under Translations — the keys start with landing.'
    ),
    (
      'site_integrations.landing.saved',
      'site_integrations',
      'Feedback after saving the landing page toggle',
      'Landing page iestatījums saglabāts.',
      'Landing page setting saved.'
    ),
    (
      'site_integrations.resend.section_hint',
      'site_integrations',
      'Resend card explanation on the integrations page',
      'Kad ieslēgts, uzaicinājumi, pieejas paziņojumi un e-pasta reģistrācija tiek sūtīti caur Resend. Bez API atslēgas un sūtītāja adreses e-pasti netiek sūtīti. Šablonus labo sadaļā E-pasta šabloni.',
      'When enabled, invites, access notices and email signup are sent through Resend. Without an API key and from address, emails are skipped. Templates are edited under Email templates.'
    ),
    (
      'site_email_templates.resend_disabled_notice',
      'site_email_templates',
      'Warning on the email templates page when Resend is off',
      'Resend ir izslēgts, tāpēc e-pasti netiek sūtīti. Ieslēdz to sadaļā Integrācijas.',
      'Resend is disabled, so no emails are sent. Enable it under Integrations.'
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
