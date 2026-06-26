-- Seed frontend modules for workers, tools, and timeline.

insert into public.site_frontend_modules (module_key, is_enabled, sort_order)
values
  ('module_workers', false, 20),
  ('module_tools', false, 30),
  ('module_timeline', false, 40)
on conflict (module_key) do nothing;
