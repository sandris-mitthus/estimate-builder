-- Seed missing position cost type translation labels.

with translations (translation_key, namespace, description, lv, en) as (
  values
    ('position.cost_type.label', 'position', '', 'Izmaksu veids', 'Cost type'),
    ('position.cost_type.labor', 'position', '', 'Darbs', 'Labor'),
    ('position.cost_type.materials', 'position', '', 'Materiāls', 'Material'),
    ('position.cost_type.mechanisms', 'position', '', 'Mehānismi', 'Mechanisms')
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
