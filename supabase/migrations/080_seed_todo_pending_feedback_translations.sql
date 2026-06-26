with translations (translation_key, namespace, description, lv, en) as (
  values
    ('todo.feedback.category_creating', 'todo', 'Category create pending feedback', 'Pievieno kategoriju…', 'Adding category…'),
    ('todo.feedback.category_saving', 'todo', 'Category save pending feedback', 'Saglabā kategoriju…', 'Saving category…'),
    ('todo.feedback.task_creating', 'todo', 'Task create pending feedback', 'Pievieno darbu…', 'Adding task…'),
    ('todo.feedback.task_saving', 'todo', 'Task save pending feedback', 'Saglabā darbu…', 'Saving task…')
)
insert into public.site_translations (
  translation_key,
  namespace,
  description,
  values
)
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
  values = excluded.values,
  updated_at = now();
