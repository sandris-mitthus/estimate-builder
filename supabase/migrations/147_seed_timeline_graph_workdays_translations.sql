-- Timeline graph: weekends excluded + workload as days/hours.

with translations (translation_key, namespace, description, lv, en) as (
  values
    (
      'timeline_graph.hours_per_day_hint',
      'timeline_graph',
      'Explains workday hours and that weekends are skipped',
      'Brīvdienas netiek ieskaitītas · 1 d = {hours} c/h',
      'Weekends are excluded · 1 d = {hours} man-hours'
    ),
    (
      'timeline_graph.column.workload',
      'timeline_graph',
      'Labor workload column label',
      'Darbietilpība',
      'Workload'
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
