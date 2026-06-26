-- Seed default frontend module for company todo list (/tasks).

insert into public.site_frontend_modules (module_key, is_enabled, sort_order)
values ('todo_list', true, 10)
on conflict (module_key) do nothing;
