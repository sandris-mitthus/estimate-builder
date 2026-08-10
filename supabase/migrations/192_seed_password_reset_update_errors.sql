-- Password reset update error messages.

with translations (translation_key, namespace, description, lv, en) as (
  values
    (
      'auth.reset.password_same_as_old',
      'auth',
      'New password must differ from the previous one',
      'Jaunajai parolei jābūt atšķirīgai no iepriekšējās.',
      'The new password must be different from the previous one.'
    ),
    (
      'auth.reset.password_too_weak',
      'auth',
      'New password rejected as too weak',
      'Parole ir pārāk vāja. Izvēlies sarežģītāku paroli.',
      'That password is too weak. Choose a stronger one.'
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
