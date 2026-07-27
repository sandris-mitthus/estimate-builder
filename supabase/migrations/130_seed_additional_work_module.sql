-- Frontend module: additional work estimates per project.

insert into public.site_frontend_modules (module_key, is_enabled, sort_order)
values ('module_additional_work', false, 50)
on conflict (module_key) do nothing;

with translations (translation_key, namespace, description, lv, en) as (
  values
    (
      'additional_work.section.title',
      'additional_work',
      'Section heading on project estimate page',
      'Papildu darbu tāmes',
      'Additional work estimates'
    ),
    (
      'additional_work.section.description',
      'additional_work',
      'Explains additional work estimates',
      'Darbi, kas radušies procesā un nav iekļauti līguma tāmē. Katram projektam var būt vairākas papildu darbu tāmes.',
      'Work that arose during the project and is not in the contract estimate. A project can have multiple additional work estimates.'
    ),
    (
      'additional_work.actions.create',
      'additional_work',
      'Create additional work estimate button',
      'Izveidot papildu darbu tāmi',
      'Create additional work estimate'
    ),
    (
      'additional_work.actions.open',
      'additional_work',
      'Open existing additional work estimate',
      'Atvērt',
      'Open'
    ),
    (
      'additional_work.default_title',
      'additional_work',
      'Default title for new additional work estimate',
      'Papildu darbi #{number}',
      'Additional work #{number}'
    ),
    (
      'additional_work.page.title',
      'additional_work',
      'Additional work estimate editor page title',
      'Papildu darbu tāme',
      'Additional work estimate'
    ),
    (
      'additional_work.page.back',
      'additional_work',
      'Back link from additional work editor',
      'Atpakaļ uz līguma tāmi',
      'Back to contract estimate'
    ),
    (
      'additional_work.feedback.created',
      'additional_work',
      'Success after creating additional work estimate',
      'Papildu darbu tāme izveidota.',
      'Additional work estimate created.'
    ),
    (
      'additional_work.feedback.saved',
      'additional_work',
      'Success after saving additional work estimate',
      'Papildu darbu tāme saglabāta.',
      'Additional work estimate saved.'
    ),
    (
      'additional_work.list.empty',
      'additional_work',
      'No additional work estimates yet',
      'Vēl nav papildu darbu tāmes.',
      'No additional work estimates yet.'
    ),
    (
      'errors.additional_work_create_failed',
      'errors',
      'Failed to create additional work estimate',
      'Neizdevās izveidot papildu darbu tāmi.',
      'Failed to create additional work estimate.'
    ),
    (
      'errors.additional_work_not_found',
      'errors',
      'Additional work estimate not found',
      'Papildu darbu tāme nav atrasta.',
      'Additional work estimate not found.'
    ),
    (
      'errors.additional_work_save_failed',
      'errors',
      'Failed to save additional work estimate',
      'Neizdevās saglabāt papildu darbu tāmi.',
      'Failed to save additional work estimate.'
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
