-- Invite existing registered users into a company (not only brand-new Auth users).

with translations (translation_key, namespace, description, lv, en) as (
  values
    (
      'users.invite.feedback.added',
      'users',
      'Toast when an already-registered user is attached to the company',
      'Lietotājs pievienots uzņēmumam.',
      'User added to the company.'
    ),
    (
      'errors.user_already_in_company',
      'errors',
      'Invite rejected because the user already belongs to this company',
      'Lietotājs jau ir šajā uzņēmumā.',
      'This user is already in this company.'
    ),
    (
      'errors.user_company_add_failed',
      'errors',
      'Failed to attach an existing user to the company',
      'Neizdevās pievienot lietotāju uzņēmumam.',
      'Failed to add the user to the company.'
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
