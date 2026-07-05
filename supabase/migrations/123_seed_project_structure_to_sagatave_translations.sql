with translations (translation_key, namespace, description, lv, en) as (
  values
    (
      'estimate.sagatave.new_positions_available',
      'estimate',
      'Banner when template has structure missing from project estimate',
      'Sagatavē ir jaunas kategorijas, subkategorijas vai pozīcijas, kuras nav šajā tāmē',
      'The template has new categories, subcategories, or positions that are not in this estimate'
    ),
    (
      'projects.list.new_sagatave_structure_available',
      'projects',
      'Project list hint for new template structure',
      'Sagatavē ir jaunas kategorijas, subkategorijas vai pozīcijas',
      'The template has new categories, subcategories, or positions'
    ),
    (
      'estimate.sagatave.restore_positions',
      'estimate',
      'Button to add missing template structure to estimate',
      'Pievienot no sagataves',
      'Add from template'
    ),
    (
      'estimate.sagatave.restore_description',
      'estimate',
      'Restore from template modal description',
      'Atzīmē kategorijas, subkategorijas un pozīcijas, kuras pievienot šai tāmei',
      'Select categories, subcategories, and positions to add to this estimate'
    ),
    (
      'estimate.sagatave.structure.category',
      'estimate',
      'Missing template category row label',
      'Kategorija',
      'Category'
    ),
    (
      'estimate.sagatave.structure.subcategory',
      'estimate',
      'Missing template subcategory row label',
      'Subkategorija',
      'Subcategory'
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
