-- Pending company invite gate copy (invited but not yet active).

with translations (translation_key, namespace, description, lv, en) as (
  values
    (
      'register_company.pending.title',
      'register_company',
      'Title when user has a pending company invite',
      'Gaidi uzaicinājumu',
      'Waiting for invite'
    ),
    (
      'register_company.pending.description',
      'register_company',
      'Description when user must open the invite email before using the app',
      'Tu esi uzaicināts uzņēmumā. Atver e-pastā saņemto saiti, lai apstiprinātu piekļuvi. Kamēr tas nav izdarīts, sistēmu lietot nevar.',
      'You have been invited to a company. Open the link in your email to confirm access. Until then you cannot use the system.'
    ),
    (
      'register_company.pending.hint',
      'register_company',
      'Hint about missing invite email',
      'Ja e-pasta nav, pārbaudi spam mapi vai paprasi administratoram nosūtīt uzaicinājumu vēlreiz.',
      'If you do not see the email, check spam or ask an administrator to resend the invite.'
    ),
    (
      'errors.pending_company_invite',
      'errors',
      'Blocked company self-registration while an invite is pending',
      'Tev jau ir gaidošs uzņēmuma uzaicinājums.',
      'You already have a pending company invite.'
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
