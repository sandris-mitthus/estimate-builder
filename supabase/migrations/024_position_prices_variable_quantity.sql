-- Pozīcijām ar mainīgu apjomu — katrā projektā definējams atsevišķi

alter table public.position_prices
add column if not exists variable_quantity boolean not null default false;
