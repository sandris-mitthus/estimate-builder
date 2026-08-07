-- Payment plans: global toggle, plan catalog with modules, per-company assignment.

alter table public.site_settings
  add column if not exists payment_plans_enabled boolean not null default false;

create table if not exists public.site_payment_plans (
  id uuid primary key default gen_random_uuid(),
  plan_key text not null,
  name_values jsonb not null default '{}'::jsonb,
  description_values jsonb not null default '{}'::jsonb,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint site_payment_plans_key_unique unique (plan_key),
  constraint site_payment_plans_key_check check (
    plan_key ~ '^[a-z0-9._:-]+$'
    and length(plan_key) between 1 and 64
  )
);

drop trigger if exists site_payment_plans_set_updated_at on public.site_payment_plans;
create trigger site_payment_plans_set_updated_at
  before update on public.site_payment_plans
  for each row execute function public.set_updated_at();

alter table public.site_payment_plans enable row level security;

drop policy if exists "site_payment_plans deny client access" on public.site_payment_plans;
create policy "site_payment_plans deny client access"
on public.site_payment_plans
as restrictive
for all
to anon, authenticated
using (false)
with check (false);

create table if not exists public.site_payment_plan_modules (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.site_payment_plans (id) on delete cascade,
  module_key text not null,
  created_at timestamptz not null default now(),
  constraint site_payment_plan_modules_unique unique (plan_id, module_key),
  constraint site_payment_plan_modules_key_check check (
    module_key ~ '^[a-z0-9._:-]+$'
    and length(module_key) between 1 and 128
  )
);

create index if not exists site_payment_plan_modules_plan_id_idx
  on public.site_payment_plan_modules (plan_id);

alter table public.site_payment_plan_modules enable row level security;

drop policy if exists "site_payment_plan_modules deny client access" on public.site_payment_plan_modules;
create policy "site_payment_plan_modules deny client access"
on public.site_payment_plan_modules
as restrictive
for all
to anon, authenticated
using (false)
with check (false);

alter table public.companies
  add column if not exists payment_plan_id uuid references public.site_payment_plans (id) on delete set null,
  add column if not exists payment_plan_until date,
  add column if not exists payment_plan_paid boolean not null default false;

create index if not exists companies_payment_plan_id_idx
  on public.companies (payment_plan_id);

with translations (translation_key, namespace, description, lv, en) as (
  values
    (
      'nav.system_admin.site_payment_plans',
      'nav',
      'System admin nav: payment plans',
      'Maksas plāni',
      'Payment plans'
    ),
    (
      'site_payment_plans.page.subtitle',
      'site_payment_plans',
      'Payment plans page subtitle',
      'Ieslēdz maksas plānus un piešķir frontend moduļus katram plānam',
      'Enable payment plans and assign frontend modules to each plan'
    ),
    (
      'site_payment_plans.enable.section',
      'site_payment_plans',
      'Enable payment plans section title',
      'Maksas plāni',
      'Payment plans'
    ),
    (
      'site_payment_plans.enable.hint',
      'site_payment_plans',
      'Enable payment plans section hint',
      'Kad ieslēgts, uzņēmuma pieejamie moduļi nāk no aktīvā maksas plāna (ja samaksāts un derīgs). Citādi izmanto individuālos uzņēmuma moduļus.',
      'When enabled, company modules come from the active payment plan (if paid and valid). Otherwise per-company module toggles are used.'
    ),
    (
      'site_payment_plans.enable.label',
      'site_payment_plans',
      'Enable payment plans switch',
      'Ieslēgt maksas plānus',
      'Enable payment plans'
    ),
    (
      'site_payment_plans.enable.saved',
      'site_payment_plans',
      'Toast after saving enable toggle',
      'Maksas plānu iestatījums saglabāts.',
      'Payment plans setting saved.'
    ),
    (
      'site_payment_plans.list.title',
      'site_payment_plans',
      'Plans list title',
      'Plāni',
      'Plans'
    ),
    (
      'site_payment_plans.list.empty',
      'site_payment_plans',
      'Empty plans list',
      'Vēl nav izveidots neviens maksas plāns.',
      'No payment plans yet.'
    ),
    (
      'site_payment_plans.actions.add',
      'site_payment_plans',
      'Add payment plan button',
      'Pievienot plānu',
      'Add plan'
    ),
    (
      'site_payment_plans.form.create_title',
      'site_payment_plans',
      'Create plan modal title',
      'Jauns maksas plāns',
      'New payment plan'
    ),
    (
      'site_payment_plans.form.edit_title',
      'site_payment_plans',
      'Edit plan modal title',
      'Labot maksas plānu',
      'Edit payment plan'
    ),
    (
      'site_payment_plans.form.key',
      'site_payment_plans',
      'Plan key field',
      'Atslēga',
      'Key'
    ),
    (
      'site_payment_plans.form.key_hint',
      'site_payment_plans',
      'Plan key hint',
      'Piemērs: starter, pro, enterprise',
      'Example: starter, pro, enterprise'
    ),
    (
      'site_payment_plans.form.name',
      'site_payment_plans',
      'Plan name field per language',
      'Nosaukums',
      'Name'
    ),
    (
      'site_payment_plans.form.description',
      'site_payment_plans',
      'Plan description field per language',
      'Apraksts',
      'Description'
    ),
    (
      'site_payment_plans.form.modules',
      'site_payment_plans',
      'Modules in plan section',
      'Moduļi šajā plānā',
      'Modules in this plan'
    ),
    (
      'site_payment_plans.form.modules_empty',
      'site_payment_plans',
      'No global modules for plan assignment',
      'Nav globāli ieslēgtu frontend moduļu.',
      'No globally enabled frontend modules.'
    ),
    (
      'site_payment_plans.feedback.created',
      'site_payment_plans',
      'Plan created toast',
      'Maksas plāns izveidots.',
      'Payment plan created.'
    ),
    (
      'site_payment_plans.feedback.saved',
      'site_payment_plans',
      'Plan saved toast',
      'Maksas plāns saglabāts.',
      'Payment plan saved.'
    ),
    (
      'site_payment_plans.feedback.deleted',
      'site_payment_plans',
      'Plan deleted toast',
      'Maksas plāns dzēsts.',
      'Payment plan deleted.'
    ),
    (
      'site_payment_plans.delete.confirm_title',
      'site_payment_plans',
      'Delete plan confirm title',
      'Dzēst maksas plānu?',
      'Delete payment plan?'
    ),
    (
      'site_payment_plans.delete.confirm_description',
      'site_payment_plans',
      'Delete plan confirm description',
      'Plāns tiks noņemts no uzņēmumiem, kuriem tas bija piešķirts.',
      'The plan will be removed from companies that had it assigned.'
    ),
    (
      'site_companies.table.plan',
      'site_companies',
      'Payment plan column header',
      'Maksas plāns',
      'Payment plan'
    ),
    (
      'site_companies.plan.none',
      'site_companies',
      'No plan assigned',
      'Nav plāna',
      'No plan'
    ),
    (
      'site_companies.plan.until',
      'site_companies',
      'Plan valid until label',
      'Līdz',
      'Until'
    ),
    (
      'site_companies.plan.paid',
      'site_companies',
      'Plan is paid',
      'Samaksāts',
      'Paid'
    ),
    (
      'site_companies.plan.unpaid',
      'site_companies',
      'Plan is unpaid',
      'Nav samaksāts',
      'Unpaid'
    ),
    (
      'site_companies.plan.expired',
      'site_companies',
      'Plan expired badge',
      'Beidzies',
      'Expired'
    ),
    (
      'site_companies.plan.modal_title',
      'site_companies',
      'Company payment plan modal title',
      'Uzņēmuma maksas plāns',
      'Company payment plan'
    ),
    (
      'site_companies.plan.modal_description',
      'site_companies',
      'Company payment plan modal description',
      'Izvēlies plānu, derīguma termiņu un samaksas statusu.',
      'Choose the plan, validity date and payment status.'
    ),
    (
      'site_companies.plan.field_plan',
      'site_companies',
      'Company plan select label',
      'Plāns',
      'Plan'
    ),
    (
      'site_companies.plan.field_until',
      'site_companies',
      'Company plan until date label',
      'Derīgs līdz',
      'Valid until'
    ),
    (
      'site_companies.plan.field_paid',
      'site_companies',
      'Company plan paid switch',
      'Samaksāts',
      'Paid'
    ),
    (
      'site_companies.plan.saved',
      'site_companies',
      'Company plan saved toast',
      'Uzņēmuma maksas plāns saglabāts.',
      'Company payment plan saved.'
    ),
    (
      'site_companies.plan.open_hint',
      'site_companies',
      'Open company plan modal hint',
      'Atvērt maksas plānu',
      'Open payment plan'
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
