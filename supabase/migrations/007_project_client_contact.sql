-- Client contact fields on projects

alter table public.projects
  add column if not exists phone text not null default '',
  add column if not exists email text not null default '';
