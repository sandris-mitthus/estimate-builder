-- Darbinieka standarta stundas likme (uzņēmuma noklusējums)

alter table public.company_settings
  add column if not exists default_hourly_rate numeric(12, 2);
