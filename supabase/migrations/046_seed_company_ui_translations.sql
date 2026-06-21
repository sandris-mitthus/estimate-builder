-- Seed company-user UI translations for non-system-admin flows.

with translations (translation_key, namespace, description, lv, en) as (
  values
    ('actions.adding', 'common', '', 'Pievieno…', 'Adding...'),
    ('actions.rename', 'common', '', 'Pārsaukt', 'Rename'),
    ('actions.sending', 'common', '', 'Sūta…', 'Sending...'),
    ('common.email', 'common', '', 'Epasts', 'Email'),
    ('common.name', 'common', '', 'Nosaukums', 'Name'),
    ('validation.name_required', 'validation', '', 'Ievadi nosaukumu.', 'Enter a name.'),

    ('admin_notice.title', 'projects', '', 'Sistēmas administrators', 'System administrator'),
    ('admin_notice.description', 'projects', '', 'Jūs esat ielogojies kā sistēmas administrators. Dashboard dati paliek tie paši, bet jums ir pieejamas papildu pārvaldības tiesības.', 'You are signed in as a system administrator. Dashboard data stays the same, but you have additional management permissions.'),
    ('projects.archive.title', 'projects', '', 'Arhīvs', 'Archive'),
    ('projects.create.action', 'projects', '', 'Jauns projekts', 'New project'),
    ('projects.page.active_subtitle', 'projects', '', '{count} aktīvi projekti', '{count} active projects'),
    ('projects.page.archive_subtitle', 'projects', '', '{count} projekti arhīvā', '{count} archived projects'),

    ('modules.create.action', 'modules', '', 'Pievienot moduli', 'Add module'),
    ('modules.create.title', 'modules', '', 'Pievienot moduli', 'Add module'),
    ('modules.create.description', 'modules', '', 'Ievadi moduļa nosaukumu', 'Enter module name'),
    ('modules.feedback.created', 'modules', '', 'Modulis pievienots.', 'Module added.'),
    ('modules.page.subtitle', 'modules', '', '{count} moduļi katalogā', '{count} modules in catalog'),

    ('settings.page.subtitle', 'settings', '', 'Uzņēmuma dati tāmēs un piedāvājumos', 'Company data in estimates and offers'),

    ('users.page.subtitle', 'users', '', '{count} lietotāji sistēmā', '{count} users in the system'),
    ('users.invite.action', 'users', '', 'Uzaicināt', 'Invite'),
    ('users.invite.title', 'users', '', 'Uzaicināt lietotāju', 'Invite user'),
    ('users.invite.description', 'users', '', 'Ievadi e-pasta adresi, lai nosūtītu uzaicinājumu', 'Enter an email address to send an invitation'),
    ('users.invite.submit', 'users', '', 'Nosūtīt uzaicinājumu', 'Send invitation'),
    ('users.invite.feedback.sent', 'users', '', 'Uzaicinājums nosūtīts.', 'Invitation sent.'),

    ('user_groups.page.subtitle', 'user_groups', '', 'Konfigurē, ko katra grupa redz un ko drīkst darīt', 'Configure what each group sees and may do'),
    ('user_groups.back_to_users', 'user_groups', '', 'Atpakaļ uz lietotājiem', 'Back to users'),
    ('user_groups.feedback.permissions_saved', 'user_groups', '', 'Grupas tiesības saglabātas.', 'Group permissions saved.'),
    ('user_groups.feedback.created', 'user_groups', '', 'Grupa izveidota.', 'Group created.'),
    ('user_groups.feedback.name_saved', 'user_groups', '', 'Grupas nosaukums saglabāts.', 'Group name saved.'),
    ('user_groups.feedback.deleted', 'user_groups', '', 'Grupa dzēsta.', 'Group deleted.'),
    ('user_groups.create.title', 'user_groups', '', 'Jauna grupa', 'New group'),
    ('user_groups.create.description', 'user_groups', '', 'Izveido uzņēmuma grupu un pēc tam izvēlies tās tiesības zemāk.', 'Create a company group and then choose its permissions below.'),
    ('user_groups.create.action', 'user_groups', '', 'Izveidot grupu', 'Create group'),
    ('user_groups.company_badge', 'user_groups', '', 'uzņēmuma', 'company'),
    ('user_groups.system_group', 'user_groups', '', 'Sistēmas grupa', 'System group'),
    ('user_groups.company_group', 'user_groups', '', 'Uzņēmuma grupa', 'Company group'),
    ('user_groups.system_group_admin_description', 'user_groups', '', 'Šī ir pamata grupa. Nosaukumu un dzēšanu nevar mainīt, bet sistēmas administrators var labot pieejas.', 'This is a base group. Its name and deletion cannot be changed, but a system administrator can edit access.'),
    ('user_groups.system_group_readonly_description', 'user_groups', '', 'Šī ir pamata grupa. Uzņēmuma lietotāji to var tikai apskatīt.', 'This is a base group. Company users can only view it.'),
    ('user_groups.company_group_description', 'user_groups', '', 'Šo grupu uzņēmums var pārsaukt, dzēst un mainīt tās pieejas, ja tai nav lietotāju.', 'The company can rename, delete, and change access for this group if it has no users.'),
    ('user_groups.permissions.save', 'user_groups', '', 'Saglabāt grupas tiesības', 'Save group permissions'),
    ('user_groups.system_permissions_admin_only', 'user_groups', '', 'Sistēmas profilu tiesības var mainīt tikai sistēmas administrators.', 'Only a system administrator can change system profile permissions.'),
    ('user_groups.company_permissions_admin_only', 'user_groups', '', 'Tikai uzņēmuma administratori var mainīt uzņēmuma profilu tiesības.', 'Only company administrators can change company profile permissions.'),
    ('user_groups.delete.title', 'user_groups', '', 'Dzēst grupu?', 'Delete group?'),
    ('user_groups.delete.confirm_prefix', 'user_groups', '', 'Vai tiešām dzēst grupu', 'Are you sure you want to delete group'),
    ('user_groups.delete.confirm_suffix', 'user_groups', '', 'Šo darbību nevar atsaukt.', 'This action cannot be undone.')
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
