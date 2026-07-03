with translations (translation_key, namespace, description, lv, en) as (
  values
    (
      'excluded_positions.feedback.restored_to_project',
      'excluded_positions',
      'Success toast when excluded position is restored to project offer',
      'Pozīcija atjaunota šī projekta piedāvājumā.',
      'Position restored to this project offer.'
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
