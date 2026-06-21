-- Seed remaining i18n keys found by the focused modules/estimate/positions audit.

with translations (translation_key, namespace, description, lv, en) as (
  values
    ('estimate.multi.unlink_from_option', 'estimate', '', 'Atvienot no {option}', 'Unlink from {option}'),
    ('estimate.multi.unlink', 'estimate', '', 'Atvienot', 'Unlink'),
    ('project_description.roof.plane_area', 'project_description', '', 'Plaknes laukums', 'Plane area'),
    ('project_description.roof.gutter_length', 'project_description', '', 'Teknes garums', 'Gutter length'),
    ('project_description.roof.downpipe_length', 'project_description', '', 'Noteku garums', 'Downpipe length'),
    ('positions.unit.placeholder', 'positions', '', 'piem. m², m³, gab.', 'e.g. m², m³, pcs.'),
    ('phone.country_code', 'phone', '', 'Valsts kods', 'Country code'),
    ('phone.detecting_country_code', 'phone', '', 'Noteic valsts kodu…', 'Detecting country code…'),
    ('phone.auto_country_code_hint', 'phone', '', 'Valsts kods noteikts automātiski. Maini sarakstā, ja pasūtītājs ir ārzemnieks.', 'Country code was detected automatically. Change it in the list if the client is abroad.')
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
