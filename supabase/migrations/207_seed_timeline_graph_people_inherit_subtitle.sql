-- People count is copied from the last project at create time (not live-synced).

with translations (translation_key, namespace, description, lv, en) as (
  values
    (
      'timeline_graph.page.subtitle',
      'timeline_graph',
      'Timeline graph page subtitle',
      'Sakļauj projektu vienā rindā vai izvērs kategorijas un subkategorijas. Jaunam projektam cilvēku skaits tiek nokopēts no pēdējā projekta pēc kategorijas nosaukuma. Paralēlā sasaistīšana pēc nosaukuma sinhronizējas starp projektiem. Vienādas kategorijas starp projektiem nepārklājas; projekti kā veselums drīkst pārklāties. Velc darbu uz citu darbu tajā pašā projektā, lai ietu paralēli. Velc projektu, lai mainītu prioritāti.',
      'Collapse a project to one row, or expand categories and subcategories. New projects copy people count from the last project by category name. Parallel linking syncs across projects by name. Same-named categories across projects do not overlap; projects as a whole may overlap. Drag a job onto another in the same project to run in parallel. Drag a project to change priority.'
    ),
    (
      'timeline_graph.page.subtitle_readonly',
      'timeline_graph',
      'Timeline graph subtitle when user cannot reorder',
      'Sakļauj projektu vienā rindā vai izvērs kategorijas un subkategorijas. Jaunam projektam cilvēku skaits tiek nokopēts no pēdējā projekta pēc kategorijas nosaukuma. Vienādas kategorijas starp projektiem nepārklājas; projekti kā veselums drīkst pārklāties.',
      'Collapse a project to one row, or expand categories and subcategories. New projects copy people count from the last project by category name. Same-named categories across projects do not overlap; projects as a whole may overlap.'
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
