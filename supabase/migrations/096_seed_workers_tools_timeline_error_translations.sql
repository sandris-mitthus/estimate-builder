with translations (translation_key, namespace, description, lv, en) as (
  values
    ('common.no_search_results', 'common', 'No search results message', 'Nekas netika atrasts.', 'No results found.'),
    ('errors.worker_create_failed', 'errors', 'Worker create failed error', 'Neizdevās pievienot darbinieku.', 'Failed to add worker.'),
    ('errors.worker_save_failed', 'errors', 'Worker save failed error', 'Neizdevās saglabāt darbinieku.', 'Failed to save worker.'),
    ('errors.worker_delete_failed', 'errors', 'Worker delete failed error', 'Neizdevās dzēst darbinieku.', 'Failed to delete worker.'),
    ('errors.tool_create_failed', 'errors', 'Tool create failed error', 'Neizdevās pievienot instrumentu.', 'Failed to add tool.'),
    ('errors.tool_save_failed', 'errors', 'Tool save failed error', 'Neizdevās saglabāt instrumentu.', 'Failed to save tool.'),
    ('errors.tool_delete_failed', 'errors', 'Tool delete failed error', 'Neizdevās dzēst instrumentu.', 'Failed to delete tool.'),
    ('errors.timeline_save_failed', 'errors', 'Timeline save failed error', 'Neizdevās saglabāt laika grafiku.', 'Failed to save timeline.')
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
