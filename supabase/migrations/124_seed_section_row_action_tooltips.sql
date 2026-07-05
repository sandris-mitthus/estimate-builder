with translations (translation_key, namespace, description, lv, en) as (
  values
    (
      'estimate.actions.add_subcategory',
      'estimate',
      'Tooltip for add subcategory icon in estimate section row',
      'Pievienot subkategoriju',
      'Add subcategory'
    ),
    (
      'estimate.actions.add_position',
      'estimate',
      'Tooltip for add position icon in estimate section row',
      'Pievienot pozīciju',
      'Add position'
    ),
    (
      'estimate.actions.add_multi',
      'estimate',
      'Tooltip for add multi-position icon in estimate section row',
      'Pievienot multi-pozīciju',
      'Add multi-position'
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
