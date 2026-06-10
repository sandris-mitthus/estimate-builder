-- Default estimate validity period (days) for new projects / deadline calculation

alter table public.company_settings
  add column if not exists estimate_validity_days integer not null default 30;

update public.company_settings
set estimate_validity_days = 30
where estimate_validity_days < 1;
