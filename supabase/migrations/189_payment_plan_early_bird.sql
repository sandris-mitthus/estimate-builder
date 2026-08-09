-- Early Bird: per-plan special prices + one global slot limit.
-- Companies keep lifelong Early Bird pricing via payment_plan_is_early_bird
-- (assigned only manually in /site_companies).

alter table public.site_payment_plans
  add column if not exists early_bird_price_month numeric(12, 2) not null default 0;

alter table public.site_payment_plans
  add column if not exists early_bird_price_quarter numeric(12, 2) not null default 0;

alter table public.site_payment_plans
  add column if not exists early_bird_price_year numeric(12, 2) not null default 0;

alter table public.site_payment_plans
  drop constraint if exists site_payment_plans_early_bird_price_month_check;
alter table public.site_payment_plans
  add constraint site_payment_plans_early_bird_price_month_check
  check (early_bird_price_month >= 0);

alter table public.site_payment_plans
  drop constraint if exists site_payment_plans_early_bird_price_quarter_check;
alter table public.site_payment_plans
  add constraint site_payment_plans_early_bird_price_quarter_check
  check (early_bird_price_quarter >= 0);

alter table public.site_payment_plans
  drop constraint if exists site_payment_plans_early_bird_price_year_check;
alter table public.site_payment_plans
  add constraint site_payment_plans_early_bird_price_year_check
  check (early_bird_price_year >= 0);

alter table public.site_settings
  add column if not exists early_bird_limit integer not null default 0;

alter table public.site_settings
  drop constraint if exists site_settings_early_bird_limit_check;
alter table public.site_settings
  add constraint site_settings_early_bird_limit_check
  check (early_bird_limit >= 0);

alter table public.companies
  add column if not exists payment_plan_is_early_bird boolean not null default false;

with translations (translation_key, namespace, description, lv, en) as (
  values
    (
      'site_payment_plans.early_bird.section',
      'site_payment_plans',
      'Early Bird settings card heading',
      'Early Bird',
      'Early Bird'
    ),
    (
      'site_payment_plans.early_bird.hint',
      'site_payment_plans',
      'Early Bird settings card explanation',
      'Kopīgs limīts, cik uzņēmumiem var piešķirt Early Bird cenas. Piešķiršana notiek manuāli uzņēmumu sarakstā. 0 — Early Bird izslēgts.',
      'Shared limit for how many companies can get Early Bird pricing. Assignment is manual on the companies list. 0 disables Early Bird.'
    ),
    (
      'site_payment_plans.early_bird.field_limit',
      'site_payment_plans',
      'Early Bird slot limit field label',
      'Slotu skaits',
      'Slot limit'
    ),
    (
      'site_payment_plans.early_bird.claimed',
      'site_payment_plans',
      'Early Bird claimed vs limit summary',
      'Piešķirts: {claimed} / {limit}',
      'Claimed: {claimed} / {limit}'
    ),
    (
      'site_payment_plans.early_bird.claimed_off',
      'site_payment_plans',
      'Early Bird claimed count when limit is off',
      'Piešķirts: {claimed} (izslēgts)',
      'Claimed: {claimed} (off)'
    ),
    (
      'site_payment_plans.early_bird.saved',
      'site_payment_plans',
      'Feedback after saving Early Bird limit',
      'Early Bird limīts saglabāts.',
      'Early Bird limit saved.'
    ),
    (
      'site_payment_plans.form.early_bird_prices',
      'site_payment_plans',
      'Early Bird price fields section heading',
      'Early Bird cenas (EUR)',
      'Early Bird prices (EUR)'
    ),
    (
      'site_payment_plans.form.early_bird_prices_hint',
      'site_payment_plans',
      'Hint under Early Bird price fields',
      'Šīs cenas attiecas uz uzņēmumiem ar Early Bird statusu un paliek uz mūžu.',
      'These prices apply to companies with Early Bird status and stay for life.'
    ),
    (
      'site_payment_plans.list.early_bird_prices',
      'site_payment_plans',
      'Plans table Early Bird prices label',
      'Early Bird',
      'Early Bird'
    ),
    (
      'site_companies.plan.early_bird',
      'site_companies',
      'Early Bird badge on company plan cell',
      'Early Bird',
      'Early Bird'
    ),
    (
      'site_companies.plan.field_early_bird',
      'site_companies',
      'Early Bird toggle in company plan modal',
      'Early Bird',
      'Early Bird'
    ),
    (
      'site_companies.plan.early_bird_hint',
      'site_companies',
      'Hint under Early Bird toggle',
      'Piešķir paliekošas Early Bird cenas. Slotu limīts ir kopīgs visiem plāniem.',
      'Grants lifelong Early Bird pricing. The slot limit is shared across all plans.'
    ),
    (
      'landing.pricing.early_bird_badge',
      'landing',
      'Early Bird badge on landing pricing cards',
      'Early Bird',
      'Early Bird'
    ),
    (
      'landing.pricing.early_bird_slots',
      'landing',
      'Remaining Early Bird slots note on landing',
      'Atlikušas Early Bird vietas: {remaining}',
      'Early Bird spots left: {remaining}'
    ),
    (
      'errors.early_bird_slots_full',
      'errors',
      'Cannot assign Early Bird because the global slot limit is reached or disabled',
      'Early Bird sloti ir izsmelti vai Early Bird nav ieslēgts.',
      'Early Bird slots are full or Early Bird is disabled.'
    ),
    (
      'errors.early_bird_limit_invalid',
      'errors',
      'Early Bird limit is not a valid non-negative integer',
      'Ievadi derīgu Early Bird slotu skaitu (0 vai vairāk).',
      'Enter a valid Early Bird slot limit (0 or more).'
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
