-- Link projects to building modules (null = individual project)

alter table public.projects
  add column if not exists building_module_id uuid references public.building_modules (id) on delete set null;

create index if not exists projects_building_module_id_idx
  on public.projects (building_module_id);
