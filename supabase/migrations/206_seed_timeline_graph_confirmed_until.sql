-- Confirmed project end date under the name (after address).

with translations (translation_key, namespace, description, lv, en) as (
  values
    (
      'timeline_graph.status.until',
      'timeline_graph',
      'Confirmed project scheduled end date suffix',
      'līdz {date}',
      'until {date}'
    )
)
insert into public.site_translations as t (
  translation_key,
  namespace,
  description,
  values
)
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
  values = t.values || excluded.values,
  updated_at = now();
