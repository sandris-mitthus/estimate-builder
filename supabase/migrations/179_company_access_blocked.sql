-- Company emergency access block + payment-plan lock UI translations.

alter table public.companies
  add column if not exists access_blocked boolean not null default false;

with translations (translation_key, namespace, description, lv, en) as (
  values
    (
      'site_companies.plan.access_blocked',
      'site_companies',
      'Manual company access block switch',
      'Bloķēt pieeju',
      'Block access'
    ),
    (
      'site_companies.plan.access_blocked_hint',
      'site_companies',
      'Hint for manual company access block',
      'Ārpuskārtas drošības slēdzis — liedz pieeju sistēmai arī pārbaudes laikā.',
      'Emergency security switch — blocks system access even during a grace period.'
    ),
    (
      'site_companies.plan.access_blocked_on',
      'site_companies',
      'Company access is blocked badge',
      'Pieeja bloķēta',
      'Access blocked'
    ),
    (
      'payment_plan.lock.expired_title',
      'payment_plan',
      'Expired payment plan lock title',
      'Maksas plānam beidzies termiņš',
      'Payment plan expired'
    ),
    (
      'payment_plan.lock.expired_description',
      'payment_plan',
      'Expired payment plan lock description',
      'Sazinies ar sistēmas administratoru, lai atjaunotu pieeju.',
      'Contact the system administrator to restore access.'
    ),
    (
      'payment_plan.lock.blocked_title',
      'payment_plan',
      'Manual access block lock title',
      'Pieeja sistēmai ir liegta',
      'System access is blocked'
    ),
    (
      'payment_plan.lock.blocked_description',
      'payment_plan',
      'Manual access block lock description',
      'Sazinies ar sistēmas administratoru, lai atjaunotu pieeju.',
      'Contact the system administrator to restore access.'
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
