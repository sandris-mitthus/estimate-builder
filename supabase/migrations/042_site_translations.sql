-- System UI translations managed by system administrators.

create table if not exists public.site_translations (
  translation_key text primary key,
  namespace text not null default '',
  description text not null default '',
  values jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint site_translations_key_check
    check (translation_key ~ '^[a-zA-Z0-9_.:-]+$')
);

create index if not exists site_translations_namespace_idx
on public.site_translations (namespace);

drop trigger if exists site_translations_set_updated_at on public.site_translations;
create trigger site_translations_set_updated_at
  before update on public.site_translations
  for each row execute function public.set_updated_at();

alter table public.site_translations enable row level security;

drop policy if exists "site_translations deny client access" on public.site_translations;
create policy "site_translations deny client access"
on public.site_translations
as restrictive
for all
to anon, authenticated
using (false)
with check (false);
