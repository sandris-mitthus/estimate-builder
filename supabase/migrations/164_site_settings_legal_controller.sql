-- Pārziņa (datu apstrādes atbildīgā) rekvizīti sistēmas uzstādījumos.
-- Līdz šim tie bija tulkojumu atslēgas ar vietturiem, kas nav valodu atkarīgi fakti.

alter table public.site_settings
  add column if not exists controller_name text not null default '',
  add column if not exists controller_registration_number text not null default '',
  add column if not exists controller_address text not null default '',
  add column if not exists controller_email text not null default '';

-- Vecās atslēgas vairs netiek lasītas: vērtība nāk no site_settings, lai
-- administratoram nav divu vietu, kur labot to pašu rekvizītu.
delete from public.site_translations
where translation_key in (
  'legal.common.controller_name',
  'legal.common.controller_registration_number',
  'legal.common.controller_address',
  'legal.common.controller_email'
);

with translations (translation_key, namespace, description, lv, en) as (
  values
    (
      'legal.controller.not_configured',
      'legal',
      'Shown in the controller details table when a site setting is still empty',
      'Nav norādīts',
      'Not provided'
    ),
    (
      'site_settings.form.controller_section',
      'site_settings',
      'Controller fieldset heading in site settings',
      'Pārzinis juridiskajos dokumentos',
      'Controller in legal documents'
    ),
    (
      'site_settings.form.controller_section_hint',
      'site_settings',
      'Controller fieldset hint in site settings',
      'Šos rekvizītus rāda privātuma politikas sadaļā par pārzini. Ja lauks ir tukšs, dokumentā redzams "Nav norādīts".',
      'These details appear in the controller section of the privacy policy. An empty field shows "Not provided" in the document.'
    ),
    (
      'site_settings.form.controller_name',
      'site_settings',
      'Controller legal name field label',
      'Pārziņa nosaukums',
      'Controller name'
    ),
    (
      'site_settings.form.controller_name_hint',
      'site_settings',
      'Controller legal name field hint',
      'Ja tukšs, izmanto sistēmas nosaukumu.',
      'If empty, the system name is used.'
    ),
    (
      'site_settings.form.controller_registration_number',
      'site_settings',
      'Controller registration number field label',
      'Reģistrācijas numurs',
      'Registration number'
    ),
    (
      'site_settings.form.controller_address',
      'site_settings',
      'Controller legal address field label',
      'Juridiskā adrese',
      'Registered address'
    ),
    (
      'site_settings.form.controller_email',
      'site_settings',
      'Controller contact email field label',
      'Kontaktu e-pasts',
      'Contact email'
    ),
    (
      'site_settings.validation.controller_email_invalid',
      'site_settings',
      'Controller email validation error',
      'Ievadi derīgu pārziņa e-pasta adresi.',
      'Enter a valid controller email address.'
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
