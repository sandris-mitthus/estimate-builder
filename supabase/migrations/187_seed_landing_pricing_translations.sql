-- Landing page pricing section: show payment plans (and their modules) when
-- payment plans are enabled. Also backfill missing module label keys that the
-- pricing cards reuse for "what's included".

with translations (translation_key, namespace, description, lv, en) as (
  values
    (
      'landing.nav.pricing',
      'landing',
      'Landing page header link to the pricing section',
      'Plāni',
      'Plans'
    ),
    (
      'landing.pricing.title',
      'landing',
      'Pricing section heading',
      'Izvēlies plānu',
      'Choose a plan'
    ),
    (
      'landing.pricing.subtitle',
      'landing',
      'Pricing section supporting sentence',
      'Katrs plāns ietver pamata tāmes iespējas. Zemāk — kas papildus ietilpst katrā līmenī.',
      'Every plan includes the core estimating features. Below is what else each level unlocks.'
    ),
    (
      'landing.pricing.core_included',
      'landing',
      'Feature listed on every plan card for the base product',
      'Tāmes redaktors, katalogs un piedāvājumi',
      'Estimate editor, catalog and offers'
    ),
    (
      'landing.pricing.modules_heading',
      'landing',
      'Heading above the plan module list',
      'Ietilpst',
      'Includes'
    ),
    (
      'landing.pricing.modules_empty',
      'landing',
      'Shown when a plan has no extra modules',
      'Tikai pamata iespējas',
      'Core features only'
    ),
    (
      'landing.pricing.recommended',
      'landing',
      'Badge on the highlighted plan card',
      'Ieteicams',
      'Recommended'
    ),
    (
      'landing.pricing.trial_note',
      'landing',
      'Note under pricing when a signup trial is configured; {days} = trial length',
      'Jauns uzņēmums sāk ar {days} dienu izmēģinājumu.',
      'New companies start with a {days}-day trial.'
    ),
    (
      'landing.pricing.cta',
      'landing',
      'Plan card button that goes to signup',
      'Sākt ar šo plānu',
      'Start with this plan'
    ),
    (
      'frontend_modules.label.module_todo_list',
      'frontend_modules',
      'Frontend module display name',
      'Darāmo darbu saraksts',
      'To-do list'
    ),
    (
      'frontend_modules.label.module_workers',
      'frontend_modules',
      'Frontend module display name',
      'Darbinieki',
      'Workers'
    ),
    (
      'frontend_modules.label.module_tools',
      'frontend_modules',
      'Frontend module display name',
      'Instrumenti',
      'Tools'
    ),
    (
      'frontend_modules.label.module_timeline_graph',
      'frontend_modules',
      'Frontend module display name',
      'Laika grafiks',
      'Timeline'
    ),
    (
      'frontend_modules.label.module_additional_work',
      'frontend_modules',
      'Frontend module display name',
      'Papildu darbu tāmes',
      'Additional work estimates'
    ),
    (
      'frontend_modules.label.module_profit',
      'frontend_modules',
      'Frontend module display name',
      'Plānotā peļņa',
      'Planned profit'
    ),
    (
      'frontend_modules.label.module_delegated_orders',
      'frontend_modules',
      'Frontend module display name',
      'Materiālu pasūtīšana un deleģēšana',
      'Material ordering and delegation'
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
