-- Veikala un kontakta dati pie cenas atjaunināšanas

alter table public.position_prices
  add column if not exists supplier_name text not null default '',
  add column if not exists supplier_contact_name text not null default '',
  add column if not exists supplier_email text not null default '',
  add column if not exists supplier_phone text not null default '';
