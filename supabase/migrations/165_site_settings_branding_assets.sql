-- Sistēmas logotips un favicon: kolonnas, privāts storage bucket un UI tulkojumi.
-- Faili tiek apkalpoti caur publiskajiem /api/site/logo un /api/site/favicon (vajadzīgi login un pārlūka cilnei).

alter table public.site_settings
  add column if not exists logo_url text not null default '',
  add column if not exists favicon_url text not null default '';

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'site-assets',
  'site-assets',
  false,
  2097152,
  array[
    'image/png',
    'image/jpeg',
    'image/webp',
    'image/svg+xml'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

with translations (translation_key, namespace, description, lv, en) as (
  values
    (
      'site_settings.form.branding_section',
      'site_settings',
      'Branding fieldset heading in site settings',
      'Zīmols',
      'Branding'
    ),
    (
      'site_settings.form.branding_section_hint',
      'site_settings',
      'Branding fieldset hint in site settings',
      'Logotips redzams sānu joslā un pieteikšanās logā. Favicon — pārlūka cilnē.',
      'The logo appears in the sidebar and on the login screen. The favicon appears in the browser tab.'
    ),
    (
      'site_settings.form.logo',
      'site_settings',
      'System logo field label',
      'Logotips',
      'Logo'
    ),
    (
      'site_settings.form.favicon',
      'site_settings',
      'Favicon field label',
      'Favicon',
      'Favicon'
    ),
    (
      'site_settings.branding.logo_drop_hint',
      'site_settings',
      'Logo dropzone hint prefix',
      'Velc un nomet logotipu šeit vai',
      'Drag and drop a logo here or'
    ),
    (
      'site_settings.branding.favicon_drop_hint',
      'site_settings',
      'Favicon dropzone hint prefix',
      'Velc un nomet favicon šeit vai',
      'Drag and drop a favicon here or'
    ),
    (
      'site_settings.branding.formats_hint',
      'site_settings',
      'Allowed branding image formats',
      'PNG, JPG, WEBP vai SVG · max 2 MB',
      'PNG, JPG, WEBP or SVG · max 2 MB'
    ),
    (
      'site_settings.branding.logo_remove',
      'site_settings',
      'Remove system logo button',
      'Noņemt logotipu',
      'Remove logo'
    ),
    (
      'site_settings.branding.favicon_remove',
      'site_settings',
      'Remove favicon button',
      'Noņemt favicon',
      'Remove favicon'
    ),
    (
      'site_settings.branding.logo_uploading',
      'site_settings',
      'Logo upload progress',
      'Augšupielādē logotipu…',
      'Uploading logo…'
    ),
    (
      'site_settings.branding.favicon_uploading',
      'site_settings',
      'Favicon upload progress',
      'Augšupielādē favicon…',
      'Uploading favicon…'
    ),
    (
      'site_settings.branding.logo_saved',
      'site_settings',
      'Logo upload success toast',
      'Logotips saglabāts.',
      'Logo saved.'
    ),
    (
      'site_settings.branding.favicon_saved',
      'site_settings',
      'Favicon upload success toast',
      'Favicon saglabāts.',
      'Favicon saved.'
    ),
    (
      'site_settings.branding.logo_removed',
      'site_settings',
      'Logo remove success toast',
      'Logotips noņemts.',
      'Logo removed.'
    ),
    (
      'site_settings.branding.favicon_removed',
      'site_settings',
      'Favicon remove success toast',
      'Favicon noņemts.',
      'Favicon removed.'
    ),
    (
      'errors.site_logo_save_failed',
      'errors',
      'Failed to save system logo URL',
      'Neizdevās saglabāt logotipu.',
      'Failed to save logo.'
    ),
    (
      'errors.site_favicon_save_failed',
      'errors',
      'Failed to save favicon URL',
      'Neizdevās saglabāt favicon.',
      'Failed to save favicon.'
    ),
    (
      'errors.site_favicon_upload_failed',
      'errors',
      'Failed to upload favicon file',
      'Neizdevās augšupielādēt favicon.',
      'Failed to upload favicon.'
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
