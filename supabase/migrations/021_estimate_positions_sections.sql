-- Tāmes pozīciju bibliotēka glabā subkategoriju līmeņa sadaļas (nevis pilnas kategorijas)

alter table public.estimate_positions
  rename column categories to sections;
