-- Lock UI when payment plan until-date is missing.

with translations (translation_key, namespace, description, lv, en) as (
  values
    (
      'payment_plan.lock.missing_until_title',
      'payment_plan',
      'Missing payment plan until-date lock title',
      'Nav norādīts maksas plāna termiņš',
      'Payment plan end date is not set'
    ),
    (
      'payment_plan.lock.missing_until_description',
      'payment_plan',
      'Missing payment plan until-date lock description',
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
