-- Google Auth integration settings for system admin /site_integrations.

alter table public.site_settings
  add column if not exists google_auth_enabled boolean not null default true,
  add column if not exists google_allowed_email_domain text not null default '',
  add column if not exists google_client_id_display text not null default '';

with translations (translation_key, namespace, description, lv, en) as (
  values
    (
      'site_integrations.google.section',
      'site_integrations',
      'Google Auth integration card title',
      'Google autentifikācija',
      'Google authentication'
    ),
    (
      'site_integrations.google.section_hint',
      'site_integrations',
      'Google Auth integration card hint',
      'Pierakstīšanās ar Google caur Supabase Auth. Client ID un Secret jāievada Supabase panelī; šeit — ieslēgšana, e-pasta domēna ierobežojums un iestatīšanas kontrolsaraksts (piem. uupis.com).',
      'Sign in with Google via Supabase Auth. Enter the Client ID and Secret in the Supabase dashboard; here you enable it, optionally restrict email domain, and follow the setup checklist (e.g. uupis.com).'
    ),
    (
      'site_integrations.google.enabled',
      'site_integrations',
      'Toggle label for Google Auth',
      'Ieslēgt Google pierakstīšanos',
      'Enable Google sign-in'
    ),
    (
      'site_integrations.google.allowed_domain',
      'site_integrations',
      'Allowed email domain field label',
      'Atļautais e-pasta domēns',
      'Allowed email domain'
    ),
    (
      'site_integrations.google.allowed_domain_hint',
      'site_integrations',
      'Allowed email domain field hint',
      'Piemērs: uupis.com — tad pēc Google login tiek ielaisti tikai @uupis.com e-pasti. Tukšs = bez ierobežojuma. Var arī iestatīt ALLOWED_EMAIL_DOMAIN vidē.',
      'Example: uupis.com — only @uupis.com emails are allowed after Google login. Empty = no restriction. You can also set ALLOWED_EMAIL_DOMAIN in the environment.'
    ),
    (
      'site_integrations.google.client_id',
      'site_integrations',
      'Display-only Google Client ID label',
      'Google Client ID (piezīme)',
      'Google Client ID (note)'
    ),
    (
      'site_integrations.google.client_id_hint',
      'site_integrations',
      'Display-only Google Client ID hint',
      'Tikai atsaucei. OAuth Client ID un Secret jāielīmē Supabase → Authentication → Providers → Google — šeit tie netiek izmantoti autentifikācijai.',
      'For reference only. Paste the OAuth Client ID and Secret in Supabase → Authentication → Providers → Google — this field is not used for authentication.'
    ),
    (
      'site_integrations.google.checklist_title',
      'site_integrations',
      'Setup checklist heading',
      'Iestatīšanas kontrolsaraksts',
      'Setup checklist'
    ),
    (
      'site_integrations.google.checklist_intro',
      'site_integrations',
      'Setup checklist intro',
      'Lai Google login strādātu uz produkta domēna (piem. uupis.com), pārbaudi šos soļus:',
      'For Google login to work on your product domain (e.g. uupis.com), complete these steps:'
    ),
    (
      'site_integrations.google.checklist_1',
      'site_integrations',
      'Checklist step 1 Google Cloud',
      '1. Google Cloud Console → APIs & Services → Credentials → OAuth 2.0 Client. Authorized redirect URI:',
      '1. Google Cloud Console → APIs & Services → Credentials → OAuth 2.0 Client. Authorized redirect URI:'
    ),
    (
      'site_integrations.google.checklist_2',
      'site_integrations',
      'Checklist step 2 Supabase provider',
      '2. Supabase → Authentication → Providers → Google → Enable, ielīmē Client ID un Client Secret.',
      '2. Supabase → Authentication → Providers → Google → Enable, paste Client ID and Client Secret.'
    ),
    (
      'site_integrations.google.checklist_3',
      'site_integrations',
      'Checklist step 3 Supabase redirect URLs',
      '3. Supabase → Authentication → URL Configuration → Site URL un Redirect URLs pievieno:',
      '3. Supabase → Authentication → URL Configuration → set Site URL and add Redirect URLs:'
    ),
    (
      'site_integrations.google.checklist_4',
      'site_integrations',
      'Checklist step 4 Vercel env',
      '4. Vercel → Environment Variables: NEXT_PUBLIC_SITE_URL = tavs produkta URL (piem. https://uupis.com), tad Redeploy.',
      '4. Vercel → Environment Variables: NEXT_PUBLIC_SITE_URL = your product URL (e.g. https://uupis.com), then Redeploy.'
    ),
    (
      'site_integrations.google.site_url_label',
      'site_integrations',
      'Current NEXT_PUBLIC_SITE_URL label',
      'Pašreizējais NEXT_PUBLIC_SITE_URL',
      'Current NEXT_PUBLIC_SITE_URL'
    ),
    (
      'site_integrations.google.site_url_missing',
      'site_integrations',
      'Missing NEXT_PUBLIC_SITE_URL warning',
      'Nav iestatīts — iestati Vercel (vai .env) uz https://uupis.com',
      'Not set — set it in Vercel (or .env) to https://uupis.com'
    ),
    (
      'site_integrations.google.app_callback_label',
      'site_integrations',
      'App OAuth callback URL label',
      'Lietotnes callback (Redirect URL)',
      'App callback (Redirect URL)'
    ),
    (
      'site_integrations.google.app_confirm_label',
      'site_integrations',
      'App auth confirm URL label',
      'E-pasta / recovery confirm URL',
      'Email / recovery confirm URL'
    ),
    (
      'site_integrations.google.supabase_callback_label',
      'site_integrations',
      'Supabase Google OAuth callback URL label',
      'Supabase Google callback (Google Cloud Console)',
      'Supabase Google callback (Google Cloud Console)'
    ),
    (
      'site_integrations.google.env_domain_configured',
      'site_integrations',
      'ALLOWED_EMAIL_DOMAIN env is set',
      'Serverī ir iestatīts ALLOWED_EMAIL_DOMAIN (vides mainīgais). DB vērtība tiek izmantota, ja tā nav tukša.',
      'ALLOWED_EMAIL_DOMAIN is set in the server environment. The DB value is used when it is not empty.'
    ),
    (
      'site_integrations.google.save',
      'site_integrations',
      'Save Google Auth settings button',
      'Saglabāt Google iestatījumus',
      'Save Google settings'
    ),
    (
      'site_integrations.google.saved',
      'site_integrations',
      'Google Auth settings saved toast',
      'Google autentifikācijas iestatījumi saglabāti.',
      'Google authentication settings saved.'
    ),
    (
      'site_integrations.google.save_failed',
      'site_integrations',
      'Failed to save Google Auth settings',
      'Neizdevās saglabāt Google autentifikācijas iestatījumus.',
      'Failed to save Google authentication settings.'
    ),
    (
      'auth.google_disabled',
      'auth',
      'Shown when Google sign-in is disabled and email auth is off',
      'Google pierakstīšanās pašlaik nav pieejama.',
      'Google sign-in is currently unavailable.'
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
