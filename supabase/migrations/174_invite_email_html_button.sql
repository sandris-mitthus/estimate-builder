-- Invite email: HTML CTA button label + body without raw link (button carries the link).

with translations (translation_key, namespace, description, lv, en) as (
  values
    (
      'email.invite.body',
      'email',
      'Body for company invitation email (HTML layout adds the confirm button)',
      'Sveiki, {name}!

Tu esi uzaicināts pievienoties uzņēmumam „{company}” sistēmā {system}.

Nospied pogu zemāk, lai apstiprinātu uzaicinājumu.',
      'Hello, {name}!

You have been invited to join “{company}” in {system}.

Press the button below to confirm the invitation.'
    ),
    (
      'email.invite.button',
      'email',
      'Confirm button label on invitation email',
      'Apstiprināt uzaicinājumu',
      'Confirm invitation'
    ),
    (
      'email.invite.footer_hint',
      'email',
      'Footer hint under the invite CTA (plain link fallback)',
      'Ja poga nedarbojas, atver šo saiti pārlūkā:',
      'If the button does not work, open this link in your browser:'
    ),
    (
      'site_email_templates.field.button',
      'site_email_templates',
      'Invite CTA button label field',
      'Pogas teksts',
      'Button label'
    ),
    (
      'site_email_templates.templates.section_hint',
      'site_email_templates',
      'Templates section hint',
      'Parametri: {name}, {company}, {system}. Uzaicinājuma HTML e-pastā poga izmanto {link}.',
      'Placeholders: {name}, {company}, {system}. The invite HTML email button uses {link}.'
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
