-- Optional billing-period prices: empty periods are hidden on the landing page.

with translations (translation_key, namespace, description, lv, en) as (
  values
    (
      'errors.payment_plan_price_invalid',
      'errors',
      'Plan price field filled but not a non-negative number',
      'Ievadi derīgu cenu (0 vai vairāk) aizpildītajiem periodiem.',
      'Enter a valid price (0 or more) for each filled billing period.'
    ),
    (
      'errors.payment_plan_price_period_required',
      'errors',
      'At least one regular billing period price is required',
      'Norādi vismaz vienu perioda cenu (mēnesis, ceturksnis vai gads).',
      'Enter at least one billing period price (month, quarter, or year).'
    ),
    (
      'site_payment_plans.form.prices_hint',
      'site_payment_plans',
      'Hint under plan price fields — empty periods stay hidden on landing',
      'Aizpildi tikai piedāvātos periodus. Tukšs periods landing lapā netiek rādīts. Decimālatdalītājs ir punkts, piemēram 29.00.',
      'Fill only the periods you offer. Empty periods are hidden on the landing page. Use a dot as decimal separator, e.g. 29.00.'
    ),
    (
      'landing.pricing.period_not_offered',
      'landing',
      'Shown on a plan card when the selected period has no price for that plan',
      'Šis periods šim plānam nav pieejams',
      'This period is not available for this plan'
    ),
    (
      'site_payment_plans.form.early_bird_prices_hint',
      'site_payment_plans',
      'Hint under Early Bird price fields',
      'Šīs cenas attiecas uz uzņēmumiem ar Early Bird statusu. Tukšus periodus vari atstāt tukšus.',
      'These prices apply to companies with Early Bird status. You can leave unused periods empty.'
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
