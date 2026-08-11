-- Material ordering is core product; module_delegated_orders is delegation only.
-- Landing pricing cards list ordering under every plan via core_included.

with translations (translation_key, namespace, description, lv, en) as (
  values
    (
      'landing.pricing.core_included',
      'landing',
      'Feature listed on every plan card for the base product',
      'Tāmes redaktors, katalogs, piedāvājumi un materiālu pasūtīšana',
      'Estimate editor, catalog, offers and material ordering'
    ),
    (
      'frontend_modules.label.module_delegated_orders',
      'frontend_modules',
      'Display name for module_delegated_orders (delegation only; ordering is core)',
      'Materiālu deleģēšana',
      'Material delegation'
    ),
    (
      'errors.delegated_orders_module_disabled',
      'errors',
      'Delegated material orders module is not enabled for the company',
      'Materiālu deleģēšanas modulis nav pieejams.',
      'The material delegation module is not available.'
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
