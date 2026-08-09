-- Frontend modules: planned profit input and delegated material orders.
-- Both features already shipped to every company, so existing companies and
-- payment plans are backfilled as enabled to keep current behavior.

insert into public.site_frontend_modules (module_key, is_enabled, sort_order)
values
  ('module_profit', true, 60),
  ('module_delegated_orders', true, 70)
on conflict (module_key) do update
set
  is_enabled = true,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.company_frontend_modules (company_id, module_key, is_enabled)
select company.id, seeded.module_key, true
from public.companies as company
cross join (
  values ('module_profit'), ('module_delegated_orders')
) as seeded (module_key)
on conflict (company_id, module_key) do update
set
  is_enabled = true,
  updated_at = now();

insert into public.site_payment_plan_modules (plan_id, module_key)
select plan.id, seeded.module_key
from public.site_payment_plans as plan
cross join (
  values ('module_profit'), ('module_delegated_orders')
) as seeded (module_key)
on conflict (plan_id, module_key) do nothing;

with translations (translation_key, namespace, description, lv, en) as (
  values
    (
      'frontend_modules.label.module_profit',
      'frontend_modules',
      'Display name for module_profit',
      'Plānotā peļņa',
      'Planned profit'
    ),
    (
      'frontend_modules.label.module_delegated_orders',
      'frontend_modules',
      'Display name for module_delegated_orders',
      'Materiālu pasūtīšana un deleģēšana',
      'Material ordering and delegation'
    ),
    (
      'errors.profit_module_disabled',
      'errors',
      'Planned profit module is not enabled for the company',
      'Plānotās peļņas modulis nav pieejams.',
      'The planned profit module is not available.'
    ),
    (
      'errors.delegated_orders_module_disabled',
      'errors',
      'Delegated material orders module is not enabled for the company',
      'Materiālu pasūtīšanas modulis nav pieejams.',
      'The material ordering module is not available.'
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
