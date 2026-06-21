-- System languages and per-user active language.

create table if not exists public.site_languages (
  code text primary key,
  name text not null,
  is_active boolean not null default true,
  is_default boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint site_languages_code_check check (code ~ '^[a-z]{2}(-[A-Z]{2})?$')
);

create unique index if not exists site_languages_single_default_idx
on public.site_languages (is_default)
where is_default = true;

drop trigger if exists site_languages_set_updated_at on public.site_languages;
create trigger site_languages_set_updated_at
  before update on public.site_languages
  for each row execute function public.set_updated_at();

alter table public.site_languages enable row level security;

drop policy if exists "site_languages deny client access" on public.site_languages;
create policy "site_languages deny client access"
on public.site_languages
as restrictive
for all
to anon, authenticated
using (false)
with check (false);

insert into public.site_languages (code, name, is_active, is_default, sort_order)
values
  ('lv', 'Latviešu', true, true, 10),
  ('en', 'English', true, false, 20)
on conflict (code) do update
set
  name = excluded.name,
  is_active = excluded.is_active,
  sort_order = excluded.sort_order;

alter table public.users
  add column if not exists active_language_code text references public.site_languages (code);

update public.users
set active_language_code = 'lv'
where active_language_code is null;
