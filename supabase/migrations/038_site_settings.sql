-- Global site settings for app metadata and system admin UI.

create table if not exists public.site_settings (
  id smallint primary key default 1 check (id = 1),
  system_name text not null default 'Estimate Builder',
  slogan text not null default 'Tāmes piedāvājumu veidošana',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists site_settings_set_updated_at on public.site_settings;
create trigger site_settings_set_updated_at
  before update on public.site_settings
  for each row execute function public.set_updated_at();

alter table public.site_settings enable row level security;

drop policy if exists "site_settings deny client access" on public.site_settings;
create policy "site_settings deny client access"
on public.site_settings
as restrictive
for all
to anon, authenticated
using (false)
with check (false);

insert into public.site_settings (id, system_name, slogan)
values (1, 'Estimate Builder', 'Tāmes piedāvājumu veidošana')
on conflict (id) do nothing;
