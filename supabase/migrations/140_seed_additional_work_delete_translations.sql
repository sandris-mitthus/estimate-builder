-- Delete confirm / feedback for additional work estimates.

with translations (translation_key, namespace, description, lv, en) as (
  values
    (
      'additional_work.delete.title',
      'additional_work',
      'Confirm delete additional work estimate title',
      'Dzēst papildu darbu tāmi?',
      'Delete additional work estimate?'
    ),
    (
      'additional_work.delete.description',
      'additional_work',
      'Confirm delete additional work estimate description',
      'Tāme tiks neatgriezeniski dzēsta.',
      'The estimate will be permanently deleted.'
    ),
    (
      'additional_work.feedback.deleted',
      'additional_work',
      'Success after deleting additional work estimate',
      'Papildu darbu tāme dzēsta.',
      'Additional work estimate deleted.'
    ),
    (
      'errors.additional_work_delete_failed',
      'errors',
      'Failed to delete additional work estimate',
      'Neizdevās dzēst papildu darbu tāmi.',
      'Failed to delete additional work estimate.'
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
