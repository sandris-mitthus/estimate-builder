-- Seed system admin todo list UI translations.

with translations (translation_key, namespace, description, lv, en) as (
  values
    (
      'nav.system_admin.todo',
      'navigation',
      'System admin todo list navigation label',
      'Todo',
      'Todo'
    ),
    (
      'todo_list.page.subtitle',
      'todo_list',
      'System admin todo list page subtitle',
      'Sistēmas administratora darāmo darbu plāns ar drag-and-drop kolonnām',
      'System administrator task plan with drag-and-drop columns'
    ),
    (
      'todo_list.add.label',
      'todo_list',
      'New task input label',
      'Jauns darbs',
      'New task'
    ),
    (
      'todo_list.add.placeholder',
      'todo_list',
      'New task input placeholder',
      'Ieraksti jaunu darbu',
      'Enter a new task'
    ),
    (
      'todo_list.add.button',
      'todo_list',
      'Add todo task button',
      'Pievienot',
      'Add'
    ),
    (
      'todo_list.delete_zone.title',
      'todo_list',
      'Todo delete drop zone title',
      'Ievelc darbu šeit, lai to izdzēstu',
      'Drag a task here to delete it'
    ),
    (
      'todo_list.delete_zone.description',
      'todo_list',
      'Todo delete drop zone description',
      'Dzēšana notiek uzreiz pēc nomešanas šajā blokā.',
      'Deletion happens immediately after dropping into this block.'
    ),
    (
      'todo_list.columns.todo',
      'todo_list',
      'Todo column heading',
      'Darāmo darbu saraksts',
      'To-do list'
    ),
    (
      'todo_list.columns.in_progress',
      'todo_list',
      'In progress column heading',
      'Darbi procesā',
      'Work in progress'
    ),
    (
      'todo_list.empty.todo',
      'todo_list',
      'Empty todo column message',
      'Šajā kolonnā vēl nav darbu.',
      'There are no tasks in this column yet.'
    ),
    (
      'todo_list.empty.in_progress',
      'todo_list',
      'Empty in progress column message',
      'Pārvelc darbu šeit, kad tas ir sākts.',
      'Drag a task here when it has been started.'
    ),
    (
      'todo_list.drag_task',
      'todo_list',
      'Todo task drag handle aria label',
      'Pārvietot darbu: {name}',
      'Move task: {name}'
    ),
    (
      'todo_list.defaults.review_docs',
      'todo_list',
      'Default todo task for documentation review',
      'Pārskatīt dokumentācijas sadaļu',
      'Review the documentation section'
    ),
    (
      'todo_list.defaults.check_translations',
      'todo_list',
      'Default todo task for translation checks',
      'Pārbaudīt jaunās tulkojumu atslēgas',
      'Check the new translation keys'
    ),
    (
      'todo_list.defaults.admin_permissions',
      'todo_list',
      'Default todo task for admin permissions',
      'Sakārtot sistēmas administratora pieejas',
      'Organize system administrator access'
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
