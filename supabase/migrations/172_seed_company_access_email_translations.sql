-- Company access change notification emails (Resend) — subject + body for lv/en.

with translations (translation_key, namespace, description, lv, en) as (
  values
    (
      'email.access.disabled.subject',
      'email',
      'Subject when company access is disabled',
      'Pieeja uzņēmumam {company} ir liegta',
      'Access to {company} has been disabled'
    ),
    (
      'email.access.disabled.body',
      'email',
      'Body when company access is disabled',
      'Sveiki, {name}!

Tava pieeja uzņēmumam „{company}” sistēmā {system} ir liegta.
Ja tas ir kļūda, sazinies ar uzņēmuma administratoru.
',
      'Hello, {name}!

Your access to “{company}” in {system} has been disabled.
If this is a mistake, contact your company administrator.
'
    ),
    (
      'email.access.restored.subject',
      'email',
      'Subject when company access is restored',
      'Pieeja uzņēmumam {company} ir atjaunota',
      'Access to {company} has been restored'
    ),
    (
      'email.access.restored.body',
      'email',
      'Body when company access is restored',
      'Sveiki, {name}!

Tava pieeja uzņēmumam „{company}” sistēmā {system} ir atjaunota. Vari atkal pierakstīties un turpināt darbu.
',
      'Hello, {name}!

Your access to “{company}” in {system} has been restored. You can sign in again and continue working.
'
    ),
    (
      'email.access.removed.subject',
      'email',
      'Subject when user is removed from the company',
      'Tu esi noņemts no uzņēmuma {company}',
      'You have been removed from {company}'
    ),
    (
      'email.access.removed.body',
      'email',
      'Body when user is removed from the company',
      'Sveiki, {name}!

Tu esi noņemts no uzņēmuma „{company}” sistēmā {system}. Šim uzņēmumam vairs nav pieejas.
',
      'Hello, {name}!

You have been removed from “{company}” in {system}. You no longer have access to this company.
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
