-- Resend integration flags on site_settings + email template / admin UI translations.

alter table public.site_settings
  add column if not exists resend_enabled boolean not null default false,
  add column if not exists email_from text not null default '',
  add column if not exists resend_api_key text not null default '';

with translations (translation_key, namespace, description, lv, en) as (
  values
    (
      'nav.system_admin.site_email_templates',
      'nav',
      'System admin nav: email templates',
      'E-pasta šabloni',
      'Email templates'
    ),
    (
      'site_email_templates.page.subtitle',
      'site_email_templates',
      'Email templates page subtitle',
      'Resend integrācija un e-pastu teksti, kas tiek sūtīti lietotājiem',
      'Resend integration and the email copy sent to users'
    ),
    (
      'site_email_templates.resend.section',
      'site_email_templates',
      'Resend config section title',
      'Resend integrācija',
      'Resend integration'
    ),
    (
      'site_email_templates.resend.section_hint',
      'site_email_templates',
      'Resend config section hint',
      'Kad ieslēgts, uzaicinājumi un pieejas paziņojumi tiek sūtīti caur Resend ar zemāk esošajiem šabloniem. Bez API atslēgas un sūtītāja adreses e-pasti netiek sūtīti.',
      'When enabled, invites and access notices are sent via Resend using the templates below. Without an API key and from address, emails are skipped.'
    ),
    (
      'site_email_templates.resend.enabled',
      'site_email_templates',
      'Enable Resend toggle label',
      'Ieslēgt Resend',
      'Enable Resend'
    ),
    (
      'site_email_templates.resend.email_from',
      'site_email_templates',
      'From address field label',
      'Sūtītāja adrese (From)',
      'From address'
    ),
    (
      'site_email_templates.resend.email_from_hint',
      'site_email_templates',
      'From address field hint',
      'Piemērs: Estimate Builder <noreply@yourdomain.com>. Domēnam jābūt verificētam Resend.',
      'Example: Estimate Builder <noreply@yourdomain.com>. The domain must be verified in Resend.'
    ),
    (
      'site_email_templates.resend.api_key',
      'site_email_templates',
      'API key field label',
      'Resend API atslēga',
      'Resend API key'
    ),
    (
      'site_email_templates.resend.api_key_hint_set',
      'site_email_templates',
      'API key hint when a key is already stored',
      'Atslēga ir saglabāta. Atstāj tukšu, lai saglabātu esošo, vai ievadi jaunu, lai aizstātu.',
      'A key is already saved. Leave blank to keep it, or enter a new one to replace it.'
    ),
    (
      'site_email_templates.resend.api_key_hint_empty',
      'site_email_templates',
      'API key hint when no key is stored',
      'Var arī iestatīt RESEND_API_KEY vides mainīgajā serverī.',
      'You can also set RESEND_API_KEY as a server environment variable.'
    ),
    (
      'site_email_templates.resend.env_key_configured',
      'site_email_templates',
      'Shown when API key comes from environment',
      'Serverī ir iestatīts RESEND_API_KEY (vides mainīgais).',
      'RESEND_API_KEY is set on the server (environment variable).'
    ),
    (
      'site_email_templates.resend.save',
      'site_email_templates',
      'Save Resend settings button',
      'Saglabāt Resend iestatījumus',
      'Save Resend settings'
    ),
    (
      'site_email_templates.resend.saved',
      'site_email_templates',
      'Resend settings saved toast',
      'Resend iestatījumi saglabāti.',
      'Resend settings saved.'
    ),
    (
      'site_email_templates.resend.validation.from_required',
      'site_email_templates',
      'Validation when enabling without from',
      'Ievadi sūtītāja adresi, lai ieslēgtu Resend.',
      'Enter a from address to enable Resend.'
    ),
    (
      'site_email_templates.resend.validation.key_required',
      'site_email_templates',
      'Validation when enabling without API key',
      'Ievadi Resend API atslēgu vai iestati RESEND_API_KEY vidē.',
      'Enter a Resend API key or set RESEND_API_KEY in the environment.'
    ),
    (
      'site_email_templates.templates.section',
      'site_email_templates',
      'Templates section title',
      'E-pasta šabloni',
      'Email templates'
    ),
    (
      'site_email_templates.templates.section_hint',
      'site_email_templates',
      'Templates section hint',
      'Parametri: {name}, {company}, {system}. Uzaicinājumam arī {link}.',
      'Placeholders: {name}, {company}, {system}. Invites also use {link}.'
    ),
    (
      'site_email_templates.template.invite',
      'site_email_templates',
      'Invite template tab label',
      'Uzaicinājums',
      'Invitation'
    ),
    (
      'site_email_templates.template.disabled',
      'site_email_templates',
      'Disabled access template tab label',
      'Pieeja liegta',
      'Access disabled'
    ),
    (
      'site_email_templates.template.restored',
      'site_email_templates',
      'Restored access template tab label',
      'Pieeja atjaunota',
      'Access restored'
    ),
    (
      'site_email_templates.template.removed',
      'site_email_templates',
      'Removed access template tab label',
      'Pieeja noņemta',
      'Access removed'
    ),
    (
      'site_email_templates.field.subject',
      'site_email_templates',
      'Subject field label',
      'Temats',
      'Subject'
    ),
    (
      'site_email_templates.field.body',
      'site_email_templates',
      'Body field label',
      'Saturs',
      'Body'
    ),
    (
      'site_email_templates.templates.save',
      'site_email_templates',
      'Save templates button',
      'Saglabāt šablonus',
      'Save templates'
    ),
    (
      'site_email_templates.templates.saved',
      'site_email_templates',
      'Templates saved toast',
      'E-pasta šabloni saglabāti.',
      'Email templates saved.'
    ),
    (
      'site_email_templates.preview.title',
      'site_email_templates',
      'Preview panel title',
      'Priekšskatījums',
      'Preview'
    ),
    (
      'email.invite.subject',
      'email',
      'Subject for company invitation email',
      'Uzaicinājums uzņēmumam {company}',
      'Invitation to {company}'
    ),
    (
      'email.invite.body',
      'email',
      'Body for company invitation email',
      'Sveiki, {name}!

Tu esi uzaicināts pievienoties uzņēmumam „{company}” sistēmā {system}.

Atver saiti, lai pieņemtu uzaicinājumu:
{link}
',
      'Hello, {name}!

You have been invited to join “{company}” in {system}.

Open the link to accept the invitation:
{link}
'
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
