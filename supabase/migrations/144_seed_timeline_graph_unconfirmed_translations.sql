-- Unconfirmed (active) projects on timeline graph — muted preview.

with translations (translation_key, namespace, description, lv, en) as (
  values
    (
      'timeline_graph.empty',
      'timeline_graph',
      'Empty timeline graph message',
      'Nav projektu laika grafikā.',
      'No projects on the timeline graph.'
    ),
    (
      'timeline_graph.legend.confirmed',
      'timeline_graph',
      'Legend for approved/completed projects',
      'Apstiprināts',
      'Approved'
    ),
    (
      'timeline_graph.legend.unconfirmed',
      'timeline_graph',
      'Legend for active unapproved projects',
      'Nav apstiprināts (aptuveni)',
      'Not approved (estimate)'
    ),
    (
      'timeline_graph.status.unconfirmed',
      'timeline_graph',
      'Unconfirmed project approximate ready date',
      'Nav apstiprināts · aptuveni līdz {date}',
      'Not approved · approx. until {date}'
    ),
    (
      'timeline_graph.page.subtitle',
      'timeline_graph',
      'Timeline graph page subtitle',
      'Kalendārs no tāmes darbietilpības. Neapstiprinātie projekti rādās blāvi kā aptuvenais termiņš; velc, lai mainītu prioritāti.',
      'Calendar from estimate workload. Unapproved projects appear muted as an approximate schedule; drag to change priority.'
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
