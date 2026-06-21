-- Seed remaining backend/repository validation and action error translations.

with translations (translation_key, namespace, description, lv, en) as (
  values
    ('validation.email_required', 'validation', '', 'Ievadi e-pasta adresi.', 'Enter an email address.'),
    ('validation.email_invalid', 'validation', '', 'Ievadi derīgu e-pasta adresi.', 'Enter a valid email address.'),
    ('validation.phone_invalid', 'validation', '', 'Ievadi derīgu telefona numuru.', 'Enter a valid phone number.'),
    ('errors.forbidden', 'errors', '', 'Nav tiesību.', 'You do not have permission.'),
    ('errors.name_too_long', 'errors', '', 'Nosaukums ir pārāk garš.', 'Name is too long.'),
    ('errors.module_not_found', 'errors', '', 'Izvēlētais modulis vairs neeksistē.', 'The selected module no longer exists.'),
    ('errors.position_delete_failed', 'errors', '', 'Neizdevās dzēst pozīciju.', 'Failed to delete position.'),
    ('errors.position_create_failed', 'errors', '', 'Neizdevās pievienot pozīciju.', 'Failed to add position.'),
    ('errors.position_update_failed', 'errors', '', 'Neizdevās atjaunināt pozīciju.', 'Failed to update position.'),
    ('errors.position_required', 'errors', '', 'Pozīcija nav norādīta.', 'Position is required.'),
    ('errors.module_create_failed', 'errors', '', 'Neizdevās pievienot moduli.', 'Failed to add module.'),
    ('errors.estimate_position_create_failed', 'errors', '', 'Neizdevās pievienot tāmes pozīciju.', 'Failed to add estimate position.'),
    ('errors.estimate_position_save_failed', 'errors', '', 'Neizdevās saglabāt tāmes pozīciju.', 'Failed to save estimate position.'),
    ('errors.block_order_save_failed', 'errors', '', 'Neizdevās saglabāt bloku secību.', 'Failed to save block order.'),
    ('errors.sort_order_save_failed', 'errors', '', 'Neizdevās saglabāt secību.', 'Failed to save order.'),
    ('errors.project_description_save_failed', 'errors', '', 'Neizdevās saglabāt projekta aprakstu.', 'Failed to save project description.'),
    ('errors.logo_upload_failed', 'errors', '', 'Neizdevās augšupielādēt logotipu.', 'Failed to upload logo.'),
    ('errors.estimate_dates_save_failed', 'errors', '', 'Neizdevās saglabāt datumus.', 'Failed to save dates.'),
    ('errors.planned_profit_save_failed', 'errors', '', 'Neizdevās saglabāt plānoto peļņu.', 'Failed to save planned profit.'),
    ('errors.estimate_approved_locked', 'errors', '', 'Tāme ir apstiprināta un to vairs nevar labot.', 'The estimate is approved and can no longer be edited.'),
    ('errors.estimate_not_found', 'errors', '', 'Tāme nav atrasta.', 'Estimate not found.'),
    ('errors.project_status_update_failed', 'errors', '', 'Neizdevās atjaunināt projekta statusu.', 'Failed to update project status.'),
    ('errors.project_status_migration_required', 'errors', '', 'Projekta statuss vēl nav pieejams. Palaid npm run db:migrate.', 'Project status is not available yet. Run npm run db:migrate.'),
    ('errors.project_already_rejected', 'errors', '', 'Projekts jau ir noraidīts.', 'Project is already rejected.'),
    ('errors.project_approve_status_invalid', 'errors', '', 'Projektu nevar apstiprināt šajā statusā.', 'Project cannot be approved in this status.'),
    ('errors.project_complete_status_invalid', 'errors', '', 'Projektu nevar atzīmēt kā pabeigtu šajā statusā.', 'Project cannot be marked completed in this status.'),
    ('errors.project_position_omit_failed', 'errors', '', 'Neizdevās noņemt pozīciju no projekta.', 'Failed to remove position from project.'),
    ('errors.material_required', 'errors', '', 'Materiāls nav norādīts.', 'Material is required.'),
    ('errors.material_order_requires_approved_project', 'errors', '', 'Materiālu pasūtīšanu var atzīmēt tikai apstiprinātam projektam.', 'Material ordering can only be marked for an approved project.'),
    ('errors.material_assign_requires_approved_project', 'errors', '', 'Lietotāju var piešķirt tikai apstiprinātam projektam.', 'A user can only be assigned to an approved project.'),
    ('errors.material_mark_ordered_failed', 'errors', '', 'Neizdevās atzīmēt materiālu kā pasūtītu.', 'Failed to mark material as ordered.'),
    ('errors.material_assign_failed', 'errors', '', 'Neizdevās piešķirt materiālu lietotājam.', 'Failed to assign material to user.'),
    ('errors.group_users_check_failed', 'errors', '', 'Neizdevās pārbaudīt grupas lietotājus.', 'Failed to check group users.'),
    ('errors.labor_norm_projects_load_failed', 'errors', '', 'Neizdevās ielādēt projektus laika normu sinhronizācijai.', 'Failed to load projects for time norm synchronization.'),
    ('errors.labor_norm_estimates_load_failed', 'errors', '', 'Neizdevās ielādēt projektu tāmes laika normu sinhronizācijai.', 'Failed to load project estimates for time norm synchronization.'),
    ('errors.labor_norm_sync_failed', 'errors', '', 'Neizdevās sinhronizēt laika normu citos projektos.', 'Failed to synchronize time norm in other projects.'),
    ('errors.svg_invalid', 'errors', '', 'SVG fails nav derīgs.', 'SVG file is invalid.'),
    ('errors.webp_magic_bytes_mismatch', 'errors', '', 'Fails neatbilst deklarētajam WebP formātam.', 'File does not match the declared WebP format.'),
    ('errors.file_magic_bytes_mismatch', 'errors', '', 'Faila saturs neatbilst deklarētajam formātam.', 'File content does not match the declared format.'),
    ('errors.rate_limit', 'errors', '', 'Pārāk daudz pieprasījumu. Mēģini vēlāk.', 'Too many requests. Try again later.')
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
