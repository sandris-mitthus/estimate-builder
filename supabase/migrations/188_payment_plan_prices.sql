-- Per-plan list prices in EUR for monthly, quarterly and yearly billing.
-- Amounts are required in the admin form; existing rows start at 0 until set.

alter table public.site_payment_plans
  add column if not exists price_month numeric(12, 2) not null default 0;

alter table public.site_payment_plans
  add column if not exists price_quarter numeric(12, 2) not null default 0;

alter table public.site_payment_plans
  add column if not exists price_year numeric(12, 2) not null default 0;

alter table public.site_payment_plans
  drop constraint if exists site_payment_plans_price_month_check;
alter table public.site_payment_plans
  add constraint site_payment_plans_price_month_check
  check (price_month >= 0);

alter table public.site_payment_plans
  drop constraint if exists site_payment_plans_price_quarter_check;
alter table public.site_payment_plans
  add constraint site_payment_plans_price_quarter_check
  check (price_quarter >= 0);

alter table public.site_payment_plans
  drop constraint if exists site_payment_plans_price_year_check;
alter table public.site_payment_plans
  add constraint site_payment_plans_price_year_check
  check (price_year >= 0);

with translations (translation_key, namespace, description, lv, en) as (
  values
    (
      'site_payment_plans.form.prices',
      'site_payment_plans',
      'Payment plan price fields section heading',
      'Cenas (EUR)',
      'Prices (EUR)'
    ),
    (
      'site_payment_plans.form.price_month',
      'site_payment_plans',
      'Monthly plan price label',
      'Mēnesis',
      'Month'
    ),
    (
      'site_payment_plans.form.price_quarter',
      'site_payment_plans',
      'Quarterly plan price label',
      'Ceturksnis',
      'Quarter'
    ),
    (
      'site_payment_plans.form.price_year',
      'site_payment_plans',
      'Yearly plan price label',
      'Gads',
      'Year'
    ),
    (
      'site_payment_plans.form.prices_hint',
      'site_payment_plans',
      'Hint under the plan price fields',
      'Norādi cenu eiro. Decimālatdalītājs ir punkts, piemēram 29.00.',
      'Enter prices in euros. Use a dot as the decimal separator, e.g. 29.00.'
    ),
    (
      'site_payment_plans.list.prices',
      'site_payment_plans',
      'Plans table prices column heading',
      'Cenas',
      'Prices'
    ),
    (
      'site_payment_plans.period.month_short',
      'site_payment_plans',
      'Short monthly period label in lists and landing cards',
      '/ mēn.',
      '/ mo'
    ),
    (
      'site_payment_plans.period.quarter_short',
      'site_payment_plans',
      'Short quarterly period label in lists and landing cards',
      '/ cet.',
      '/ qtr'
    ),
    (
      'site_payment_plans.period.year_short',
      'site_payment_plans',
      'Short yearly period label in lists and landing cards',
      '/ gadā',
      '/ yr'
    ),
    (
      'landing.pricing.period.month',
      'landing',
      'Landing pricing period tab — month',
      'Mēnesis',
      'Monthly'
    ),
    (
      'landing.pricing.period.quarter',
      'landing',
      'Landing pricing period tab — quarter',
      'Ceturksnis',
      'Quarterly'
    ),
    (
      'landing.pricing.period.year',
      'landing',
      'Landing pricing period tab — year',
      'Gads',
      'Yearly'
    ),
    (
      'errors.payment_plan_price_invalid',
      'errors',
      'Plan price missing or not a non-negative number',
      'Ievadi derīgu cenu (0 vai vairāk) katram periodam.',
      'Enter a valid price (0 or more) for each billing period.'
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
