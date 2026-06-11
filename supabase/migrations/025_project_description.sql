-- Projekta apraksta forma (pamati, sienas, logi, durvis)

alter table public.building_modules
  add column if not exists project_description jsonb not null default '{}'::jsonb;

alter table public.projects
  add column if not exists project_description jsonb not null default '{}'::jsonb;
