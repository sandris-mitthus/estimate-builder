-- Global user announcements (system admin). Shown as a dismissible banner
-- until expires_at (inclusive) while is_enabled is true.

create table if not exists public.site_announcements (
  id uuid primary key default gen_random_uuid(),
  title_values jsonb not null default '{}'::jsonb,
  body_values jsonb not null default '{}'::jsonb,
  expires_at date not null,
  is_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists site_announcements_active_idx
  on public.site_announcements (is_enabled, expires_at)
  where is_enabled = true;

drop trigger if exists site_announcements_set_updated_at on public.site_announcements;
create trigger site_announcements_set_updated_at
  before update on public.site_announcements
  for each row execute function public.set_updated_at();

alter table public.site_announcements enable row level security;

drop policy if exists "site_announcements deny client access" on public.site_announcements;
create policy "site_announcements deny client access"
on public.site_announcements
as restrictive
for all
to anon, authenticated
using (false)
with check (false);

with translations (translation_key, namespace, description, lv, en) as (
  values
    (
      'nav.system_admin.site_announcements',
      'navigation',
      'System admin global announcements navigation label',
      'Paziņojumi',
      'Announcements'
    ),
    (
      'site_announcements.page.subtitle',
      'site_announcements',
      'System admin announcements page subtitle',
      'Globāli paziņojumi visiem lietotājiem ar termiņu un ieslēgšanas slēdzi',
      'Global announcements for all users, with an expiry date and an on/off switch'
    ),
    (
      'site_announcements.list.title',
      'site_announcements',
      'Announcements list heading',
      'Paziņojumi',
      'Announcements'
    ),
    (
      'site_announcements.table.empty',
      'site_announcements',
      'Empty announcements table',
      'Nav paziņojumu.',
      'No announcements.'
    ),
    (
      'site_announcements.table.title',
      'site_announcements',
      'Announcements table title column',
      'Virsraksts',
      'Title'
    ),
    (
      'site_announcements.table.expires',
      'site_announcements',
      'Announcements table expiry column',
      'Termiņš',
      'Expires'
    ),
    (
      'site_announcements.status.expired',
      'site_announcements',
      'Badge when announcement expiry date has passed',
      'Beidzies',
      'Expired'
    ),
    (
      'site_announcements.form.create_title',
      'site_announcements',
      'Create announcement modal title',
      'Jauns paziņojums',
      'New announcement'
    ),
    (
      'site_announcements.form.edit_title',
      'site_announcements',
      'Edit announcement modal title',
      'Labot paziņojumu',
      'Edit announcement'
    ),
    (
      'site_announcements.form.title',
      'site_announcements',
      'Announcement title field',
      'Virsraksts',
      'Title'
    ),
    (
      'site_announcements.form.body',
      'site_announcements',
      'Announcement body field',
      'Teksts',
      'Message'
    ),
    (
      'site_announcements.form.expires',
      'site_announcements',
      'Announcement expiry date field',
      'Termiņš',
      'Expires'
    ),
    (
      'site_announcements.form.expires_hint',
      'site_announcements',
      'Announcement expiry date hint',
      'Pēc šī datuma paziņojums lietotājiem vairs nerādās.',
      'After this date the announcement is no longer shown to users.'
    ),
    (
      'site_announcements.form.enabled',
      'site_announcements',
      'Announcement enabled toggle label',
      'Rādīt lietotājiem',
      'Show to users'
    ),
    (
      'site_announcements.form.enabled_hint',
      'site_announcements',
      'Announcement enabled toggle hint',
      'Kad ieslēgts un termiņš nav beidzies, paziņojuma bloks rādās visiem lietotājiem.',
      'When on and not expired, the announcement block is shown to all users.'
    ),
    (
      'site_announcements.feedback.created',
      'site_announcements',
      'Toast after announcement created',
      'Paziņojums pievienots.',
      'Announcement created.'
    ),
    (
      'site_announcements.feedback.saved',
      'site_announcements',
      'Toast after announcement saved',
      'Paziņojums saglabāts.',
      'Announcement saved.'
    ),
    (
      'site_announcements.feedback.deleted',
      'site_announcements',
      'Toast after announcement deleted',
      'Paziņojums dzēsts.',
      'Announcement deleted.'
    ),
    (
      'site_announcements.feedback.status_saved',
      'site_announcements',
      'Toast after announcement enabled toggle saved',
      'Paziņojuma statuss saglabāts.',
      'Announcement status saved.'
    ),
    (
      'site_announcements.delete.confirm_title',
      'site_announcements',
      'Delete announcement confirm title',
      'Dzēst paziņojumu?',
      'Delete announcement?'
    ),
    (
      'site_announcements.delete.confirm_description',
      'site_announcements',
      'Delete announcement confirm description',
      'Paziņojums tiks neatgriezeniski dzēsts.',
      'The announcement will be permanently deleted.'
    ),
    (
      'site_announcements.aria.enabled',
      'site_announcements',
      'Aria label for announcement enabled switch',
      '{title} ieslēgts',
      '{title} enabled'
    ),
    (
      'site_announcements.validation.title_required',
      'site_announcements',
      'Announcement title required validation',
      'Ievadi paziņojuma virsrakstu vismaz vienā valodā.',
      'Enter the announcement title in at least one language.'
    ),
    (
      'site_announcements.validation.expires_required',
      'site_announcements',
      'Announcement expiry required validation',
      'Norādi paziņojuma termiņu.',
      'Set the announcement expiry date.'
    ),
    (
      'site_announcements.validation.expires_invalid',
      'site_announcements',
      'Announcement expiry invalid validation',
      'Ievadi derīgu termiņa datumu.',
      'Enter a valid expiry date.'
    ),
    (
      'errors.announcement_not_found',
      'errors',
      'Announcement not found',
      'Paziņojums nav atrasts.',
      'Announcement not found.'
    ),
    (
      'errors.announcement_create_failed',
      'errors',
      'Announcement create failed',
      'Neizdevās izveidot paziņojumu.',
      'Could not create the announcement.'
    ),
    (
      'errors.announcement_save_failed',
      'errors',
      'Announcement save failed',
      'Neizdevās saglabāt paziņojumu.',
      'Could not save the announcement.'
    ),
    (
      'errors.announcement_delete_failed',
      'errors',
      'Announcement delete failed',
      'Neizdevās dzēst paziņojumu.',
      'Could not delete the announcement.'
    ),
    (
      'errors.announcement_status_save_failed',
      'errors',
      'Announcement status save failed',
      'Neizdevās saglabāt paziņojuma statusu.',
      'Could not save the announcement status.'
    ),
    (
      'legal.cookies.table.announcement.purpose',
      'legal',
      'Cookie registry purpose for dismissed global announcements',
      'Atceras, ka esi aizvēris globālo paziņojumu, lai tas netiktu rādīts atkārtoti.',
      'Remembers that you dismissed a global announcement so it is not shown again.'
    ),
    (
      'legal.cookies.table.announcement.retention',
      'legal',
      'Cookie registry retention for dismissed global announcements',
      'Līdz paziņojuma termiņam vai 12 mēnešiem',
      'Until the announcement expires or 12 months'
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
