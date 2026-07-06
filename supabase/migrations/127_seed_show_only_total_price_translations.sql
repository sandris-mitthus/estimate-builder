with translations (translation_key, namespace, description, lv, en) as (
  values
    (
      'estimate.offer.show_only_total',
      'estimate',
      'Tooltip for bookmark toggle — enable show only line total in sagatave table',
      'Rādīt tikai gala summu',
      'Show only final total'
    ),
    (
      'estimate.offer.show_full_breakdown',
      'estimate',
      'Tooltip for bookmark toggle — restore full unit price breakdown in sagatave table',
      'Rādīt katras pozicijas izcenojumu',
      'Show each position unit price breakdown'
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
  values = excluded.values,
  updated_at = now();
