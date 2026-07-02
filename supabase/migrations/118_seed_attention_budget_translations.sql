with translations (translation_key, namespace, description, lv, en) as (
  values
    (
      'estimate.attention.budget_label',
      'estimate',
      'Approximate budget label for attention-flagged positions',
      'Aptuvens budžets',
      'Approximate budget'
    ),
    (
      'estimate.attention.section_title',
      'estimate',
      'Section title for attention flag and budget in modals',
      'Īpaša uzmanība',
      'Special attention'
    ),
    (
      'estimate.sagatave.change_field.attention_budget',
      'estimate',
      'Sagatave sync field: attention budget',
      'Aptuvens budžets',
      'Approximate budget'
    ),
    (
      'estimate.sagatave.change_field.multi_attention_budget',
      'estimate',
      'Sagatave sync field: multi attention budget',
      'Multi aptuvens budžets',
      'Multi approximate budget'
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
