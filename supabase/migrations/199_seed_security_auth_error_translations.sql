-- Security / branding error translation updates (SVG logos disallowed; auth rate limit; storage path).

with translations (translation_key, namespace, description, lv, en) as (
  values
    (
      'errors.logo_format_supported',
      'errors',
      'Company and site branding logo formats (raster only)',
      'Atbalstīti formāti: PNG, JPG, WEBP.',
      'Supported formats: PNG, JPG, WEBP.'
    ),
    (
      'errors.invalid_storage_path',
      'errors',
      'Module/project block storage path outside company scope',
      'Nederīgs faila ceļš.',
      'Invalid file path.'
    ),
    (
      'errors.membership_check_failed',
      'errors',
      'Failed to verify company membership before group assign',
      'Neizdevās pārbaudīt lietotāja piederību.',
      'Failed to verify user membership.'
    ),
    (
      'errors.user_not_company_member',
      'errors',
      'Cannot assign group without company membership',
      'Lietotājs nav šī uzņēmuma biedrs. Vispirms uzaicini lietotāju.',
      'User is not a member of this company. Invite the user first.'
    ),
    (
      'errors.auth_rate_limit',
      'errors',
      'Auth email / login rate limit',
      'Pārāk daudz mēģinājumu. Mēģini vēlāk.',
      'Too many attempts. Try again later.'
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
