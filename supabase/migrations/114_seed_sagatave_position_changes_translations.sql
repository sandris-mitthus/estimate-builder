-- Sagatave position changes sync UI (project estimate + project list).

with translations (translation_key, namespace, description, lv, en) as (
  values
    ('common.yes', 'common', 'Yes label', 'Jā', 'Yes'),
    ('common.no', 'common', 'No label', 'Nē', 'No'),
    (
      'estimate.sagatave.changes_available',
      'estimate',
      'Banner when sagatave template differs from project estimate',
      'Sagatavē ir izmaiņas, kuras var pielāgot šai tāmei',
      'The template has changes that can be applied to this estimate'
    ),
    (
      'estimate.sagatave.sync_changes',
      'estimate',
      'Button to open sagatave sync modal',
      'Pielāgot no sagataves',
      'Apply from template'
    ),
    (
      'estimate.sagatave.sync_title',
      'estimate',
      'Sagatave sync modal title',
      'Izmaiņas no sagataves',
      'Changes from template'
    ),
    (
      'estimate.sagatave.sync_description',
      'estimate',
      'Sagatave sync modal description',
      'Atzīmē izmaiņas, kuras pielāgot šai tāmei',
      'Select changes to apply to this estimate'
    ),
    (
      'estimate.sagatave.apply_selected',
      'estimate',
      'Apply selected sagatave changes',
      'Pielāgot izvēlētās',
      'Apply selected'
    ),
    (
      'estimate.sagatave.change_module_size_set',
      'estimate',
      'Module size attachment changed',
      'Mainīta',
      'Changed'
    ),
    (
      'estimate.sagatave.change_current_list',
      'estimate',
      'Current materials/mechanisms list',
      'Pašreizējais',
      'Current'
    ),
    (
      'estimate.sagatave.change_template_list',
      'estimate',
      'Template materials/mechanisms list',
      'No sagataves',
      'From template'
    ),
    ('estimate.sagatave.change_field.unit', 'estimate', 'Sagatave sync field: unit', 'Mērvienība', 'Unit'),
    ('estimate.sagatave.change_field.note', 'estimate', 'Sagatave sync field: note', 'Piezīme', 'Note'),
    (
      'estimate.sagatave.change_field.labor_time_norm',
      'estimate',
      'Sagatave sync field: labor time norm',
      'Laika norma',
      'Labor time norm'
    ),
    (
      'estimate.sagatave.change_field.variable_quantity',
      'estimate',
      'Sagatave sync field: variable quantity',
      'Individuāls apjoms',
      'Individual quantity'
    ),
    (
      'estimate.sagatave.change_field.manual_unit',
      'estimate',
      'Sagatave sync field: manual unit',
      'Manuālā mērvienība',
      'Manual unit'
    ),
    (
      'estimate.sagatave.change_field.module_size',
      'estimate',
      'Sagatave sync field: module size attachment',
      'Moduļa lieluma piesaiste',
      'Module size attachment'
    ),
    (
      'estimate.sagatave.change_field.custom_hourly_rate',
      'estimate',
      'Sagatave sync field: custom hourly rate',
      'Individuālā stundas likme',
      'Custom hourly rate'
    ),
    (
      'estimate.sagatave.change_field.hidden_price_in_offer',
      'estimate',
      'Sagatave sync field: hidden price in offer',
      'Cena paslēpta piedāvājumā',
      'Price hidden in offer'
    ),
    ('estimate.sagatave.change_field.materials', 'estimate', 'Sagatave sync field: materials', 'Materiāli', 'Materials'),
    ('estimate.sagatave.change_field.mechanisms', 'estimate', 'Sagatave sync field: mechanisms', 'Mehānismi', 'Mechanisms'),
    ('estimate.sagatave.change_field.multi_name', 'estimate', 'Sagatave sync field: multi name', 'Multi nosaukums', 'Multi name'),
    (
      'estimate.sagatave.change_field.hidden_in_offer',
      'estimate',
      'Sagatave sync field: hidden in offer',
      'Pozīcijas paslēptas piedāvājumā',
      'Positions hidden in offer'
    ),
    (
      'estimate.sagatave.change_field.hidden_prices_in_offer',
      'estimate',
      'Sagatave sync field: hidden prices in offer',
      'Cenas paslēptas piedāvājumā',
      'Prices hidden in offer'
    ),
    (
      'projects.list.sagatave_changes_available',
      'projects',
      'Project card hint for sagatave position changes',
      'Sagatavē ir izmaiņas pozīcijām',
      'Template has position changes'
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
