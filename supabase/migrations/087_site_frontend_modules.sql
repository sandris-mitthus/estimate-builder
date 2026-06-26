-- System admin: frontend feature modules (key + enabled flag).

create table if not exists public.site_frontend_modules (
  id uuid primary key default gen_random_uuid(),
  module_key text not null,
  is_enabled boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint site_frontend_modules_key_unique unique (module_key),
  constraint site_frontend_modules_key_check check (
    module_key ~ '^[a-z0-9._:-]+$'
    and length(module_key) between 1 and 128
  )
);

drop trigger if exists site_frontend_modules_set_updated_at on public.site_frontend_modules;
create trigger site_frontend_modules_set_updated_at
  before update on public.site_frontend_modules
  for each row execute function public.set_updated_at();

alter table public.site_frontend_modules enable row level security;

drop policy if exists "site_frontend_modules deny client access" on public.site_frontend_modules;
create policy "site_frontend_modules deny client access"
on public.site_frontend_modules
as restrictive
for all
to anon, authenticated
using (false)
with check (false);
