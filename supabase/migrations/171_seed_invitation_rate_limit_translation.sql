-- Invite email rate-limit feedback for re-invites.

with translations (translation_key, namespace, description, lv, en) as (
  values
    (
      'errors.invitation_rate_limited',
      'errors',
      'Shown when Supabase email send rate limit blocks another invite',
      'Uzaicinājuma e-pastu var sūtīt pārāk bieži. Uzgaidi minūti un mēģini vēlreiz.',
      'Invite emails can only be sent so often. Wait a minute and try again.'
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
