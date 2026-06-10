-- Ēku moduļi: tikai nosaukums

alter table public.building_modules
  drop column if exists address;
