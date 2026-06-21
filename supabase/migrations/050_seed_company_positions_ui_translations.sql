-- Seed company position management translations.

with translations (translation_key, namespace, description, lv, en) as (
  values
    ('validation.unit_required', 'validation', '', 'Ievadi mērvienību.', 'Enter a unit.'),
    ('validation.cost_type_required', 'validation', '', 'Izvēlies izmaksu veidu.', 'Choose a cost type.'),

    ('positions.add.action', 'positions', '', 'Pievienot pozīciju', 'Add position'),
    ('positions.add.title', 'positions', '', 'Pievienot pozīciju', 'Add position'),
    ('positions.form.description', 'positions', '', 'Norādi pozīcijas nosaukumu, mērvienību un izmaksu veidu', 'Enter the position name, unit, and cost type'),
    ('positions.edit.title', 'positions', '', 'Labot pozīciju', 'Edit position'),
    ('positions.edit.description', 'positions', '', 'Atjaunini pozīcijas nosaukumu, mērvienību un izmaksu veidu', 'Update the position name, unit, and cost type'),
    ('positions.edit_name.description', 'positions', '', 'Atjaunini pozīcijas nosaukumu', 'Update the position name'),
    ('positions.delete.title', 'positions', '', 'Dzēst pozīciju?', 'Delete position?'),
    ('positions.delete.confirm_prefix', 'positions', '', 'Vai tiešām vēlies dzēst pozīciju', 'Are you sure you want to delete position'),
    ('positions.feedback.added', 'positions', '', 'Pozīcija pievienota.', 'Position added.'),
    ('positions.feedback.updated', 'positions', '', 'Pozīcija atjaunināta.', 'Position updated.'),
    ('positions.feedback.deleted', 'positions', '', 'Pozīcija dzēsta.', 'Position deleted.'),

    ('excluded_positions.add.title', 'excluded_positions', '', 'Pievienot neiekļauto pozīciju', 'Add excluded position'),
    ('excluded_positions.add.description', 'excluded_positions', '', 'Norādi pozīciju, kas nav iekļauta piedāvājumā', 'Enter a position that is not included in the offer'),
    ('excluded_positions.edit.title', 'excluded_positions', '', 'Labot neiekļauto pozīciju', 'Edit excluded position'),
    ('excluded_positions.name_placeholder', 'excluded_positions', '', 'Piem., Demontāžas darbi', 'E.g., demolition works')
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
