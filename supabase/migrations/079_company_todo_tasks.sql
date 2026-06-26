-- Company todo board with editable categories and draggable tasks.

create table if not exists public.todo_categories (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  title text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, id),
  constraint todo_categories_title_check check (length(trim(title)) > 0)
);

create table if not exists public.todo_tasks (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null,
  category_id uuid not null,
  title text not null,
  description text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (company_id, category_id)
    references public.todo_categories (company_id, id)
    on delete cascade,
  constraint todo_tasks_title_check check (length(trim(title)) > 0)
);

create index if not exists todo_categories_company_sort_order_idx
on public.todo_categories (company_id, sort_order, title);

create index if not exists todo_tasks_company_category_sort_order_idx
on public.todo_tasks (company_id, category_id, sort_order, title);

drop trigger if exists todo_categories_set_updated_at on public.todo_categories;
create trigger todo_categories_set_updated_at
  before update on public.todo_categories
  for each row execute function public.set_updated_at();

drop trigger if exists todo_tasks_set_updated_at on public.todo_tasks;
create trigger todo_tasks_set_updated_at
  before update on public.todo_tasks
  for each row execute function public.set_updated_at();

alter table public.todo_categories enable row level security;
alter table public.todo_tasks enable row level security;

drop policy if exists "todo_categories deny client access" on public.todo_categories;
create policy "todo_categories deny client access"
on public.todo_categories
as restrictive
for all
to anon, authenticated
using (false)
with check (false);

drop policy if exists "todo_tasks deny client access" on public.todo_tasks;
create policy "todo_tasks deny client access"
on public.todo_tasks
as restrictive
for all
to anon, authenticated
using (false)
with check (false);

update public.site_user_groups
set
  permissions = jsonb_set(permissions, '{nav,todo}', 'true'::jsonb, true),
  updated_at = now()
where slug in ('admin', 'viewer');

update public.company_user_groups
set
  permissions = jsonb_set(permissions, '{nav,todo}', 'true'::jsonb, true),
  updated_at = now()
where slug in ('admin', 'viewer')
  and is_system = true;

with translations (translation_key, namespace, description, lv, en) as (
  values
    ('nav.todo', 'navigation', 'Company todo board navigation label', 'Darāmo darbu saraksts', 'Todo list'),
    ('todo.page.subtitle', 'todo', 'Todo board page subtitle', 'Veido kategorijas, pievieno darbus un pārvelc tos augšup, lejup vai uz citu kategoriju.', 'Create categories, add tasks, and drag them up, down, or into another category.'),
    ('todo.category.add', 'todo', 'Add todo category button', 'Pievienot kategoriju', 'Add category'),
    ('todo.category.edit', 'todo', 'Edit todo category action', 'Labot kategoriju', 'Edit category'),
    ('todo.category.delete_action', 'todo', 'Delete todo category action', 'Dzēst kategoriju', 'Delete category'),
    ('todo.category.task_count', 'todo', 'Todo category task count', '{count} darbi', '{count} tasks'),
    ('todo.category.empty', 'todo', 'Empty todo category message', 'Šajā kategorijā vēl nav darbu. Ievelc darbu šeit vai pievieno jaunu.', 'There are no tasks in this category yet. Drag a task here or add a new one.'),
    ('todo.task.add', 'todo', 'Add todo task button', 'Pievienot darbu', 'Add task'),
    ('todo.task.drag', 'todo', 'Todo task drag handle aria label', 'Pārvietot darbu: {name}', 'Move task: {name}'),
    ('todo.empty_page', 'todo', 'Empty todo board message', 'Pievieno pirmo kategoriju, lai sāktu veidot darāmo darbu sarakstu.', 'Add the first category to start building the todo list.'),
    ('todo.validation.category_title_required', 'todo', 'Category title validation error', 'Ievadi kategorijas nosaukumu.', 'Enter a category name.'),
    ('todo.validation.category_required', 'todo', 'Task category validation error', 'Izvēlies kategoriju.', 'Choose a category.'),
    ('todo.validation.task_title_required', 'todo', 'Task title validation error', 'Ievadi darba nosaukumu.', 'Enter a task title.'),
    ('todo.feedback.category_saved', 'todo', 'Category saved feedback', 'Kategorija saglabāta.', 'Category saved.'),
    ('todo.feedback.category_created', 'todo', 'Category created feedback', 'Kategorija pievienota.', 'Category added.'),
    ('todo.feedback.category_deleted', 'todo', 'Category deleted feedback', 'Kategorija dzēsta.', 'Category deleted.'),
    ('todo.feedback.task_saved', 'todo', 'Task saved feedback', 'Darbs saglabāts.', 'Task saved.'),
    ('todo.feedback.task_created', 'todo', 'Task created feedback', 'Darbs pievienots.', 'Task added.'),
    ('todo.feedback.task_deleted', 'todo', 'Task deleted feedback', 'Darbs dzēsts.', 'Task deleted.'),
    ('todo.feedback.order_saved', 'todo', 'Task order saved feedback', 'Darbu secība saglabāta.', 'Task order saved.'),
    ('todo.category_modal.edit_title', 'todo', 'Edit category modal title', 'Labot kategoriju', 'Edit category'),
    ('todo.category_modal.create_title', 'todo', 'Create category modal title', 'Jauna kategorija', 'New category'),
    ('todo.category_modal.title_label', 'todo', 'Category title field label', 'Kategorijas nosaukums', 'Category name'),
    ('todo.category_modal.title_placeholder', 'todo', 'Category title placeholder', 'Piemēram, Materiālu pasūtīšana', 'For example, Ordering materials'),
    ('todo.task_modal.edit_title', 'todo', 'Edit task modal title', 'Labot darbu', 'Edit task'),
    ('todo.task_modal.create_title', 'todo', 'Create task modal title', 'Jauns darbs', 'New task'),
    ('todo.task_modal.category_label', 'todo', 'Task category field label', 'Kategorija', 'Category'),
    ('todo.task_modal.title_label', 'todo', 'Task title field label', 'Darba nosaukums', 'Task title'),
    ('todo.task_modal.title_placeholder', 'todo', 'Task title placeholder', 'Piemēram, Pasūtīt skrūves un profilus', 'For example, Order screws and profiles'),
    ('todo.task_modal.description_label', 'todo', 'Task description field label', 'Apraksts', 'Description'),
    ('todo.task_modal.description_placeholder', 'todo', 'Task description placeholder', 'Papildu piezīmes par darba izpildi.', 'Additional notes about completing the task.'),
    ('todo.delete_category.title', 'todo', 'Delete category confirmation title', 'Dzēst kategoriju?', 'Delete category?'),
    ('todo.delete_category.description', 'todo', 'Delete category confirmation description', 'Kategorija un visi tajā esošie darbi tiks dzēsti.', 'The category and all tasks inside it will be deleted.'),
    ('todo.delete_task.title', 'todo', 'Delete task confirmation title', 'Dzēst darbu?', 'Delete task?'),
    ('todo.delete_task.description', 'todo', 'Delete task confirmation description', 'Darbs tiks dzēsts no darāmo darbu saraksta.', 'The task will be deleted from the todo list.')
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
