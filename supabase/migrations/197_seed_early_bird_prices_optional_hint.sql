-- Early Bird price hint: unused periods may stay empty.

with translations (translation_key, namespace, description, lv, en) as (
  values
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
