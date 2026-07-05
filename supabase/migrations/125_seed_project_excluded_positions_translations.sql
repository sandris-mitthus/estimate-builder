with translations (translation_key, namespace, description, lv, en) as (
  values
    (
      'excluded_positions.project.add_action',
      'excluded_positions',
      'Projekta neiekļauto pozīciju bloka poga',
      'Pievienot pozīciju',
      'Add position'
    ),
    (
      'excluded_positions.project.add_description',
      'excluded_positions',
      'Projekta modālis — jaunas neiekļautās pozīcijas pievienošana',
      'Pozīcija tiks pievienota globālajam sarakstam un šī projekta piedāvājumam. Pārējos projektos tā būs paslēpta.',
      'The position will be added to the global list and this project offer. In other projects it will be hidden.'
    ),
    (
      'excluded_positions.project.empty_list',
      'excluded_positions',
      'Tukšs neiekļauto pozīciju saraksts projektā',
      'Nav neiekļauto pozīciju.',
      'No excluded positions yet.'
    ),
    (
      'excluded_positions.feedback.added_from_project',
      'excluded_positions',
      'Veiksmīga jaunas neiekļautās pozīcijas pievienošana no projekta',
      'Pozīcija pievienota globālajam sarakstam.',
      'Position added to the global list.'
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
