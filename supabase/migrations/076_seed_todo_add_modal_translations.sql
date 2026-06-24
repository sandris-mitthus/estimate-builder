-- Seed todo add modal translations.

with translations (translation_key, namespace, description, lv, en) as (
  values
    (
      'todo_list.add.title',
      'todo_list',
      'Todo add modal title',
      'Pievienot uzdevumu',
      'Add task'
    ),
    (
      'todo_list.add.description',
      'todo_list',
      'Todo add modal description',
      'Ieraksti uzdevuma nosaukumu un aprakstu.',
      'Enter the task title and description.'
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
