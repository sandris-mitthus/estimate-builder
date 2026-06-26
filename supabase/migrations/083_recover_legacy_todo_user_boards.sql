-- Copy pre-user-scope todo categories/tasks to active company users as personal boards.

with legacy_categories as (
  select
    category.id,
    category.company_id,
    category.user_id,
    category.title,
    category.sort_order
  from public.todo_categories category
  where category.source_key is null
),
category_copy_targets as (
  select
    legacy.id as legacy_category_id,
    company_user.company_id,
    company_user.user_id,
    'legacy-copy:' || legacy.id::text as source_key,
    legacy.title,
    legacy.sort_order
  from legacy_categories legacy
  join public.company_users company_user
    on company_user.company_id = legacy.company_id
    and company_user.status <> 'disabled'
    and company_user.user_id <> legacy.user_id
),
inserted_categories as (
  insert into public.todo_categories (
    company_id,
    user_id,
    source_key,
    title,
    sort_order
  )
  select
    target.company_id,
    target.user_id,
    target.source_key,
    target.title,
    target.sort_order
  from category_copy_targets target
  on conflict (company_id, user_id, source_key) do update
  set
    title = excluded.title,
    sort_order = excluded.sort_order,
    updated_at = now()
  returning id, company_id, user_id, source_key
),
category_map as (
  select
    target.legacy_category_id,
    inserted.id as copied_category_id,
    inserted.company_id,
    inserted.user_id
  from inserted_categories inserted
  join category_copy_targets target
    on target.company_id = inserted.company_id
    and target.user_id = inserted.user_id
    and target.source_key = inserted.source_key
)
insert into public.todo_tasks (
  company_id,
  user_id,
  category_id,
  source_key,
  title,
  description,
  sort_order
)
select
  category_map.company_id,
  category_map.user_id,
  category_map.copied_category_id,
  'legacy-copy:' || legacy_task.id::text,
  legacy_task.title,
  legacy_task.description,
  legacy_task.sort_order
from category_map
join public.todo_tasks legacy_task
  on legacy_task.company_id = category_map.company_id
  and legacy_task.category_id = category_map.legacy_category_id
on conflict (company_id, user_id, source_key) do update
set
  title = excluded.title,
  description = excluded.description,
  sort_order = excluded.sort_order,
  updated_at = now();
