with translations (translation_key, namespace, description, lv, en) as (
  values
    ('todo.delete_zone.title', 'todo', 'Todo delete drop zone title', 'Ievelc uzdevumu šeit, lai to izdzēstu', 'Drag a task here to delete it'),
    ('todo.delete_zone.description', 'todo', 'Todo delete drop zone description', 'Atlaižot peli, uzdevums tiks dzēsts.', 'When you release the mouse, the task will be deleted.')
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
