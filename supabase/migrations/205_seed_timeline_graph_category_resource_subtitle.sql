-- Timeline graph: same-named categories do not overlap across projects; projects may overlap.

with translations (translation_key, namespace, description, lv, en) as (
  values
    (
      'timeline_graph.page.subtitle',
      'timeline_graph',
      'Timeline graph page subtitle',
      'Sakļauj projektu vienā rindā vai izvērs kategorijas un subkategorijas. Cilvēku skaits un paralēlā sasaistīšana pēc nosaukuma sinhronizējas starp projektiem. Vienādas kategorijas starp projektiem nepārklājas; projekti kā veselums drīkst pārklāties. Velc darbu uz citu darbu tajā pašā projektā, lai ietu paralēli. Velc projektu, lai mainītu prioritāti.',
      'Collapse a project to one row, or expand categories and subcategories. People count and parallel linking sync across projects by name. Same-named categories across projects do not overlap; projects as a whole may overlap. Drag a job onto another in the same project to run in parallel. Drag a project to change priority.'
    ),
    (
      'timeline_graph.page.subtitle_readonly',
      'timeline_graph',
      'Timeline graph subtitle when user cannot reorder',
      'Sakļauj projektu vienā rindā vai izvērs kategorijas un subkategorijas. Cilvēku skaits un paralēlā sasaistīšana pēc nosaukuma sinhronizējas starp projektiem. Vienādas kategorijas starp projektiem nepārklājas; projekti kā veselums drīkst pārklāties.',
      'Collapse a project to one row, or expand categories and subcategories. People count and parallel linking sync across projects by name. Same-named categories across projects do not overlap; projects as a whole may overlap.'
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
