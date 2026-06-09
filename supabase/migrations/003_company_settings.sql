-- Singleton company settings (one row, id = 1)

create table public.company_settings (
  id smallint primary key default 1 check (id = 1),
  company_name text not null default '',
  address text not null default '',
  registration_number text not null default '',
  vat_number text not null default '',
  bank_name text not null default '',
  swift text not null default '',
  bank_account_number text not null default '',
  phone text not null default '',
  email text not null default '',
  currency text not null default 'EUR',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger company_settings_set_updated_at
  before update on public.company_settings
  for each row execute function public.set_updated_at();

alter table public.company_settings enable row level security;

insert into public.company_settings (id) values (1)
on conflict (id) do nothing;
