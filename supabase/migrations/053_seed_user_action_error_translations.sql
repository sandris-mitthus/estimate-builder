-- Seed remaining user action error translations.

with translations (translation_key, namespace, description, lv, en) as (
  values
    ('errors.user_cannot_disable_self', 'errors', '', 'Nevar liegt pieeju pašam sev.', 'You cannot disable access for yourself.'),
    ('errors.system_profile_permissions_admin_only', 'errors', '', 'Sistēmas profilu tiesības var mainīt tikai sistēmas administrators.', 'Only a system administrator can change system profile permissions.')
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
