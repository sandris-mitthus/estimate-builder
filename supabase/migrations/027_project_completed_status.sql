-- Completed projects: hidden from list, kept in DB for later review (from approved)

alter table public.projects
  drop constraint if exists projects_status_check;

alter table public.projects
  add constraint projects_status_check
  check (status in ('active', 'approved', 'rejected', 'completed'));
