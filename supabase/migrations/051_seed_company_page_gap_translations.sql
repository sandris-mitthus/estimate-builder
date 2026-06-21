-- Seed remaining company page-level navigation and wrapper translations.

with translations (translation_key, namespace, description, lv, en) as (
  values
    ('common.price', 'common', '', 'Cena', 'Price'),
    ('common.type', 'common', '', 'Veids', 'Type'),
    ('projects.back_to_projects', 'projects', '', 'Atpakaļ uz projektiem', 'Back to projects'),
    ('projects.back_to_project', 'projects', '', 'Atpakaļ uz projektu', 'Back to project'),
    ('modules.back_to_modules', 'modules', '', 'Atpakaļ uz moduļiem', 'Back to modules'),
    ('positions.page.subtitle', 'positions', '', '{count} pozīcijas katalogā', '{count} positions in catalog'),
    ('positions.page.filtered_subtitle', 'positions', '', '{visible} no {total} pozīcijām', '{visible} of {total} positions'),
    ('positions.search.label', 'positions', '', 'Meklēt pozīcijas', 'Search positions'),
    ('positions.search.placeholder', 'positions', '', 'Meklēt pozīcijas…', 'Search positions...'),
    ('positions.empty.filtered', 'positions', '', 'Nav atrastu pozīciju.', 'No positions found.'),
    ('positions.empty.catalog', 'positions', '', 'Nav pozīciju katalogā.', 'No positions in catalog.'),
    ('positions.drag.named', 'positions', '', 'Pārvietot pozīciju: {name}', 'Move position: {name}'),
    ('excluded_positions.empty.subtitle', 'excluded_positions', '', 'Nav definētu pozīciju', 'No positions defined'),
    ('excluded_positions.page.subtitle', 'excluded_positions', '', '{count} pozīcijas piedāvājumā neiekļautas', '{count} positions excluded from the offer'),
    ('excluded_positions.empty.description', 'excluded_positions', '', 'Pievieno pozīcijas, kas netiek iekļautas piedāvājumā. Saraksts parādīsies piedāvājuma PDF.', 'Add positions that are not included in the offer. The list will appear in the offer PDF.')
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
