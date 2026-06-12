-- Project workflow status: active (default), approved, rejected (hidden from list)

alter table public.projects
  add column if not exists status text not null default 'active';

alter table public.projects
  drop constraint if exists projects_status_check;

alter table public.projects
  add constraint projects_status_check
  check (status in ('active', 'approved', 'rejected'));

create index if not exists projects_status_idx
  on public.projects (status);
