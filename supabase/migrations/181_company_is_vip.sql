-- Company VIP flag: bypasses payment-plan locks; modules still apply.

alter table public.companies
  add column if not exists is_vip boolean not null default false;

with translations (translation_key, namespace, description, lv, en) as (
  values
    (
      'site_companies.vip.label',
      'site_companies',
      'VIP star toggle aria/tooltip',
      'VIP',
      'VIP'
    ),
    (
      'site_companies.vip.on',
      'site_companies',
      'VIP enabled toast',
      'VIP ieslēgts — maksas plāna ierobežojumi neattiecas.',
      'VIP enabled — payment plan restrictions do not apply.'
    ),
    (
      'site_companies.vip.off',
      'site_companies',
      'VIP disabled toast',
      'VIP izslēgts.',
      'VIP disabled.'
    ),
    (
      'site_companies.vip.modules_section',
      'site_companies',
      'Modules section for VIP company in plan modal',
      'Moduļi (VIP)',
      'Modules (VIP)'
    ),
    (
      'site_companies.vip.modules_hint',
      'site_companies',
      'Hint that VIP uses company module toggles',
      'VIP uzņēmumam joprojām darbojas individuālie moduļu slēdži.',
      'VIP companies still use individual module switches.'
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
