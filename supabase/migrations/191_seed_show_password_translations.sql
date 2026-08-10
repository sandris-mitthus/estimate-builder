-- Show / hide password toggle labels (reset password form).

with translations (translation_key, namespace, description, lv, en) as (
  values
    (
      'auth.email.show_password',
      'auth',
      'Show password toggle aria/tooltip',
      'Rādīt paroli',
      'Show password'
    ),
    (
      'auth.email.hide_password',
      'auth',
      'Hide password toggle aria/tooltip',
      'Paslēpt paroli',
      'Hide password'
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
