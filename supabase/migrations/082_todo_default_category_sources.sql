-- Add stable source keys for system-created todo categories/tasks.

alter table public.todo_categories
add column if not exists source_key text;

alter table public.todo_tasks
add column if not exists source_key text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'todo_categories_company_user_source_key'
      and conrelid = 'public.todo_categories'::regclass
  ) then
    alter table public.todo_categories
    add constraint todo_categories_company_user_source_key
    unique (company_id, user_id, source_key);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'todo_tasks_company_user_source_key'
      and conrelid = 'public.todo_tasks'::regclass
  ) then
    alter table public.todo_tasks
    add constraint todo_tasks_company_user_source_key
    unique (company_id, user_id, source_key);
  end if;
end $$;

insert into public.todo_categories (
  company_id,
  user_id,
  source_key,
  title,
  sort_order
)
select
  company_user.company_id,
  company_user.user_id,
  'default:tasks',
  'Uzdevumi',
  0
from public.company_users company_user
where company_user.status <> 'disabled'
on conflict (company_id, user_id, source_key) do update
set
  title = excluded.title,
  sort_order = excluded.sort_order,
  updated_at = now();
