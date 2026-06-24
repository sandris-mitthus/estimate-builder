-- Seed todo task title, description, and edit modal translations.

with translations (translation_key, namespace, description, lv, en) as (
  values
    (
      'todo_list.fields.title',
      'todo_list',
      'Todo task title field label',
      'Nosaukums',
      'Title'
    ),
    (
      'todo_list.fields.title_placeholder',
      'todo_list',
      'Todo task title field placeholder',
      'Uzdevuma nosaukums',
      'Task title'
    ),
    (
      'todo_list.fields.description',
      'todo_list',
      'Todo task description field label',
      'Apraksts',
      'Description'
    ),
    (
      'todo_list.fields.description_placeholder',
      'todo_list',
      'Todo task description field placeholder',
      'Uzdevuma apraksts',
      'Task description'
    ),
    (
      'todo_list.edit.title',
      'todo_list',
      'Todo edit modal title',
      'Labot uzdevumu',
      'Edit task'
    ),
    (
      'todo_list.edit.description',
      'todo_list',
      'Todo edit modal description',
      'Atjauno uzdevuma nosaukumu un aprakstu.',
      'Update the task title and description.'
    ),
    (
      'todo_list.defaults.review_docs_description',
      'todo_list',
      'Default todo documentation review task description',
      'Pārbaudīt, vai publiskā dokumentācija atbilst jaunākajai sistēmas funkcionalitātei.',
      'Check whether the public documentation matches the latest system functionality.'
    ),
    (
      'todo_list.defaults.check_translations_description',
      'todo_list',
      'Default todo translation check task description',
      'Pārliecināties, ka jaunajiem UI tekstiem ir latviešu un angļu tulkojumi.',
      'Make sure the new UI texts have Latvian and English translations.'
    ),
    (
      'todo_list.defaults.admin_permissions_description',
      'todo_list',
      'Default todo admin permissions task description',
      'Pārskatīt sistēmas administratora izvēlnes sadaļas un pieejas.',
      'Review the system administrator menu sections and access.'
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
