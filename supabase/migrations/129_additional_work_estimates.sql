-- Multiple estimates per project: one main contract estimate + additional work estimates.

alter table public.estimates
  add column if not exists estimate_kind text not null default 'main';

alter table public.estimates
  add column if not exists display_name text not null default '';

update public.estimates
set display_name = title
where display_name = ''
  and coalesce(title, '') <> '';

alter table public.estimates
  drop constraint if exists estimates_project_id_key;

alter table public.estimates
  drop constraint if exists estimates_kind_check;

alter table public.estimates
  add constraint estimates_kind_check check (
    estimate_kind in ('main', 'additional_work')
  );

create unique index if not exists estimates_one_main_per_project_idx
  on public.estimates (company_id, project_id)
  where estimate_kind = 'main';

create index if not exists estimates_project_kind_idx
  on public.estimates (project_id, estimate_kind);
