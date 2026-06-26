-- Scope company todo categories and tasks to the user who owns them.

alter table public.todo_categories
add column if not exists user_id uuid;

alter table public.todo_tasks
add column if not exists user_id uuid;

update public.todo_categories category
set user_id = (
  select company_user.user_id
  from public.company_users company_user
  where company_user.company_id = category.company_id
    and company_user.status <> 'disabled'
  order by company_user.created_at asc
  limit 1
)
where category.user_id is null;

update public.todo_tasks task
set user_id = category.user_id
from public.todo_categories category
where task.company_id = category.company_id
  and task.category_id = category.id
  and task.user_id is null;

do $$
begin
  if not exists (
    select 1 from public.todo_categories where user_id is null
  ) then
    alter table public.todo_categories
    alter column user_id set not null;
  end if;

  if not exists (
    select 1 from public.todo_tasks where user_id is null
  ) then
    alter table public.todo_tasks
    alter column user_id set not null;
  end if;
end $$;

create index if not exists todo_categories_company_user_sort_order_idx
on public.todo_categories (company_id, user_id, sort_order, title);

create index if not exists todo_tasks_company_user_category_sort_order_idx
on public.todo_tasks (company_id, user_id, category_id, sort_order, title);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'todo_categories_company_user_id_key'
      and conrelid = 'public.todo_categories'::regclass
  ) then
    alter table public.todo_categories
    add constraint todo_categories_company_user_id_key
    unique (company_id, user_id, id);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'todo_categories_company_user_fk'
      and conrelid = 'public.todo_categories'::regclass
  ) then
    alter table public.todo_categories
    add constraint todo_categories_company_user_fk
    foreign key (company_id, user_id)
    references public.company_users (company_id, user_id)
    on delete cascade;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'todo_tasks_company_user_fk'
      and conrelid = 'public.todo_tasks'::regclass
  ) then
    alter table public.todo_tasks
    add constraint todo_tasks_company_user_fk
    foreign key (company_id, user_id)
    references public.company_users (company_id, user_id)
    on delete cascade;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'todo_tasks_company_user_category_fk'
      and conrelid = 'public.todo_tasks'::regclass
  ) then
    alter table public.todo_tasks
    add constraint todo_tasks_company_user_category_fk
    foreign key (company_id, user_id, category_id)
    references public.todo_categories (company_id, user_id, id)
    on delete cascade;
  end if;
end $$;
