-- Timeline graph calendar / schedule translations.

with translations (translation_key, namespace, description, lv, en) as (
  values
    (
      'timeline_graph.page.subtitle',
      'timeline_graph',
      'Timeline graph page subtitle',
      'Kalendārs no tāmes darbietilpības. Projekti fiksēti kreisajā pusē; velc, lai mainītu prioritāti.',
      'Calendar from estimate workload. Projects stay fixed on the left; drag to change priority.'
    ),
    (
      'timeline_graph.column.project',
      'timeline_graph',
      'Project column header',
      'Projekts',
      'Project'
    ),
    (
      'timeline_graph.hours_per_day_hint',
      'timeline_graph',
      'Explains workday hours used for bar length',
      '1 diena = {hours} c/h',
      '1 day = {hours} man-hours'
    ),
    (
      'timeline_graph.bar_range',
      'timeline_graph',
      'Scheduled bar date range tooltip',
      '{start} — {end}',
      '{start} — {end}'
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
