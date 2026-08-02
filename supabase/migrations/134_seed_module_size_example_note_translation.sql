-- Seed note explaining that sagatave module sizes are only an example.

with translations (translation_key, namespace, description, lv, en) as (
  values
    ('modules.sizes.example_note', 'modules', '', 'Skaitļi šeit ir tikai piemērs no viena moduļa. Katrā tāmē apjoms tiks aprēķināts no tā projekta moduļa lielumiem.', 'The numbers here are only an example from one module. In each estimate the quantity is calculated from that project module sizes.')
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
