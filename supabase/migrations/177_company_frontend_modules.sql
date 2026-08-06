-- Per-company frontend module enable flags.
-- Global site_frontend_modules.is_enabled = catalog availability.
-- company_frontend_modules.is_enabled = company assignment (default off; not auto-enabled).

create table if not exists public.company_frontend_modules (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  module_key text not null,
  is_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint company_frontend_modules_company_key_unique unique (company_id, module_key),
  constraint company_frontend_modules_key_check check (
    module_key ~ '^[a-z0-9._:-]+$'
    and length(module_key) between 1 and 128
  )
);

create index if not exists company_frontend_modules_company_id_idx
  on public.company_frontend_modules (company_id);

drop trigger if exists company_frontend_modules_set_updated_at on public.company_frontend_modules;
create trigger company_frontend_modules_set_updated_at
  before update on public.company_frontend_modules
  for each row execute function public.set_updated_at();

alter table public.company_frontend_modules enable row level security;

drop policy if exists "company_frontend_modules deny client access" on public.company_frontend_modules;
create policy "company_frontend_modules deny client access"
on public.company_frontend_modules
as restrictive
for all
to anon, authenticated
using (false)
with check (false);

with translations (translation_key, namespace, description, lv, en) as (
  values
    (
      'site_companies.modules.modal_title',
      'site_companies',
      'Company frontend modules modal title',
      'Uzņēmuma moduļi',
      'Company modules'
    ),
    (
      'site_companies.modules.modal_description',
      'site_companies',
      'Company frontend modules modal description',
      'Ieslēdz, ar kuriem sistēmas frontend moduļiem šis uzņēmums drīkst strādāt. Globāli izslēgtie moduļi nav pieejami.',
      'Enable which system frontend modules this company may use. Globally disabled modules are unavailable.'
    ),
    (
      'site_companies.modules.empty',
      'site_companies',
      'No globally enabled modules to assign',
      'Nav globāli ieslēgtu frontend moduļu, ko piešķirt uzņēmumam.',
      'There are no globally enabled frontend modules to assign to the company.'
    ),
    (
      'site_companies.modules.global_off',
      'site_companies',
      'Badge when global module is off',
      'Globāli izslēgts',
      'Globally off'
    ),
    (
      'site_companies.modules.saved',
      'site_companies',
      'Toast after company module toggle saved',
      'Uzņēmuma moduļa statuss saglabāts.',
      'Company module status saved.'
    ),
    (
      'site_companies.modules.open_hint',
      'site_companies',
      'Hint that company row opens modules modal',
      'Atvērt moduļus',
      'Open modules'
    ),
    (
      'frontend_modules.label.module_todo_list',
      'frontend_modules',
      'Display name for module_todo_list',
      'Darāmo darbu saraksts',
      'Todo list'
    ),
    (
      'frontend_modules.label.module_workers',
      'frontend_modules',
      'Display name for module_workers',
      'Darbinieki',
      'Workers'
    ),
    (
      'frontend_modules.label.module_tools',
      'frontend_modules',
      'Display name for module_tools',
      'Instrumenti',
      'Tools'
    ),
    (
      'frontend_modules.label.module_timeline_graph',
      'frontend_modules',
      'Display name for module_timeline_graph',
      'Laika grafiks',
      'Timeline graph'
    ),
    (
      'frontend_modules.label.module_additional_work',
      'frontend_modules',
      'Display name for module_additional_work',
      'Papildu darbi',
      'Additional work'
    )
)
insert into public.site_translations (translation_key, namespace, description, values)
select
  translation_key,
  namespace,
  description,
  jsonb_build_object('lv', lv, 'en', en)
from translations
on conflict (translation_key) do update
set
  namespace = excluded.namespace,
  description = excluded.description,
  values = public.site_translations.values || excluded.values,
  updated_at = now();
