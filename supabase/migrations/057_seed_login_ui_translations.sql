-- Seed login page UI translations.

with translations (translation_key, namespace, description, lv, en) as (
  values
    ('auth.google_sign_in', 'auth', '', 'Turpināt ar Google', 'Continue with Google'),
    ('auth.signing_in', 'auth', '', 'Pierakstās...', 'Signing in...'),
    ('auth.errors.google_not_enabled', 'auth', '', 'Google nav ieslēgts Supabase projektā. Authentication → Providers → Google → Enable.', 'Google is not enabled in the Supabase project. Authentication → Providers → Google → Enable.')
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
