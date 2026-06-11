-- Pozīcijas izmaksu veids: darbs, materiāls vai mehānisms

alter table public.position_prices
  add column if not exists cost_type text;

update public.position_prices
set cost_type = 'labor'
where cost_type is null or cost_type not in ('labor', 'materials', 'mechanisms');

alter table public.position_prices
  alter column cost_type set default 'labor',
  alter column cost_type set not null;

alter table public.position_prices
  drop constraint if exists position_prices_cost_type_check;

alter table public.position_prices
  add constraint position_prices_cost_type_check
  check (cost_type in ('labor', 'materials', 'mechanisms'));
