-- Auth confirm failure copy for invite / magic-link hash session handling.

with translations (translation_key, namespace, description, lv, en) as (
  values
    (
      'auth.confirm.failed',
      'auth',
      'Shown when invite or magic-link session could not be established from the URL',
      'Uzaicinājuma saite nav derīga vai ir beigusies. Paprasī jaunu uzaicinājumu un atver to tajā pašā pārlūkā.',
      'The invite link is invalid or has expired. Request a new invite and open it in the same browser.'
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
