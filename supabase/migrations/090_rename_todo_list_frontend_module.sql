-- Rename frontend module key todo_list -> module_todo_list.

delete from public.site_frontend_modules
where module_key = 'todo_list'
  and exists (
    select 1
    from public.site_frontend_modules as existing
    where existing.module_key = 'module_todo_list'
  );

update public.site_frontend_modules
set module_key = 'module_todo_list'
where module_key = 'todo_list'
  and not exists (
    select 1
    from public.site_frontend_modules as existing
    where existing.module_key = 'module_todo_list'
  );

insert into public.site_frontend_modules (module_key, is_enabled, sort_order)
values ('module_todo_list', true, 10)
on conflict (module_key) do nothing;
