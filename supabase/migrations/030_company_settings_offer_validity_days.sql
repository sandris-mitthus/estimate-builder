-- Piedāvājuma derīguma termiņš dienās (PDF: „Piedāvājums spēkā X dienas”)

alter table public.company_settings
  add column if not exists offer_validity_days integer not null default 30;
