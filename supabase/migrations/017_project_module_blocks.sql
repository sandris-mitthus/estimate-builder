-- Individual project module data (visualizations + project PDFs)

alter table public.projects
  add column if not exists visualization_blocks jsonb not null default '[]'::jsonb,
  add column if not exists project_blocks jsonb not null default '[]'::jsonb;
