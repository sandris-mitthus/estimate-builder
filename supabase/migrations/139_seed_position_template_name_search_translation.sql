-- Seed PositionModal name search placeholder (sagatave / additional work templates).

with translations (translation_key, namespace, description, lv, en) as (
  values
    (
      'positions.modal.name_search_placeholder',
      'positions',
      '',
      'Meklēt sagataves pozīciju vai ievadīt jaunu',
      'Search template position or enter a new name'
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
