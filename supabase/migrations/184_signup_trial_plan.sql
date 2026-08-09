-- Trial plan for companies created through public signup.
-- Without it, a brand-new company has no payment plan and (with payment plans
-- enabled) lands straight in the "missing_until" access lock.

alter table public.site_settings
  add column if not exists trial_plan_id uuid
    references public.site_payment_plans (id) on delete set null;

alter table public.site_settings
  add column if not exists trial_days integer not null default 14;

alter table public.companies
  add column if not exists payment_plan_is_trial boolean not null default false;

-- Default the trial to the most capable plan: a trial should show the full
-- product. Admins can change or clear it in /site_payment_plans.
update public.site_settings
set trial_plan_id = coalesce(
      (select id from public.site_payment_plans where plan_key = 'plat_pro'),
      (
        select id
        from public.site_payment_plans
        order by sort_order desc, plan_key
        limit 1
      )
    )
where id = 1
  and trial_plan_id is null;

with translations (translation_key, namespace, description, lv, en) as (
  values
    (
      'site_payment_plans.trial.section',
      'site_payment_plans',
      'Trial settings card heading',
      'Izmēģinājuma periods',
      'Trial period'
    ),
    (
      'site_payment_plans.trial.hint',
      'site_payment_plans',
      'Trial settings card explanation',
      'Jauns uzņēmums pēc reģistrācijas saņem šo plānu uz norādīto dienu skaitu. Bez izmēģinājuma plāna jaunam uzņēmumam nav pieejas, kamēr plānu nepiešķir manuāli.',
      'A new company receives this plan for the given number of days right after registration. Without a trial plan, a new company has no access until a plan is assigned manually.'
    ),
    (
      'site_payment_plans.trial.field_plan',
      'site_payment_plans',
      'Trial plan select label',
      'Plāns jauniem uzņēmumiem',
      'Plan for new companies'
    ),
    (
      'site_payment_plans.trial.plan_none',
      'site_payment_plans',
      'Trial plan select option that disables the trial',
      'Bez izmēģinājuma',
      'No trial'
    ),
    (
      'site_payment_plans.trial.field_days',
      'site_payment_plans',
      'Trial length field label',
      'Izmēģinājuma dienas',
      'Trial days'
    ),
    (
      'site_payment_plans.trial.days_hint',
      'site_payment_plans',
      'Trial length field hint',
      'No 1 līdz 365 dienām.',
      'Between 1 and 365 days.'
    ),
    (
      'site_payment_plans.trial.saved',
      'site_payment_plans',
      'Feedback after saving trial settings',
      'Izmēģinājuma iestatījumi saglabāti.',
      'Trial settings saved.'
    ),
    (
      'site_companies.plan.trial',
      'site_companies',
      'Badge shown instead of the paid badge while a company is on its trial',
      'Izmēģinājums',
      'Trial'
    ),
    (
      'errors.trial_days_invalid',
      'errors',
      'Trial length outside the allowed range',
      'Ievadi izmēģinājuma dienu skaitu no 1 līdz 365.',
      'Enter a trial length between 1 and 365 days.'
    ),
    (
      'errors.payment_plan_not_found',
      'errors',
      'Referenced payment plan does not exist',
      'Maksas plāns nav atrasts.',
      'The payment plan was not found.'
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
