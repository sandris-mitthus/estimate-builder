import type { TranslationParams } from "@/app/lib/i18n/translations";

type Translate = (
  key: string,
  fallback?: string,
  params?: TranslationParams,
) => string;

type ActionErrorLike = {
  error: string;
  errorKey?: string;
  errorParams?: TranslationParams;
};

const ERROR_KEYS_BY_TEXT: Record<string, string> = {
  "Datubāze nav konfigurēta.": "errors.database_not_configured",
  "Datubāze nav konfigurēta. Pievieno SUPABASE_SERVICE_ROLE_KEY.":
    "errors.database_service_role_not_configured",
  "Avota projekta tāme nav atrasta.": "errors.source_estimate_not_found",
  "Atbalstīti formāti: PNG, JPG, WEBP, SVG.": "errors.logo_format_supported",
  "Attēls nedrīkst būt lielāks par 10 MB.": "errors.image_too_large",
  "Avota projekts nav atrasts.": "errors.source_project_not_found",
  "Bloks nav atrasts.": "errors.block_not_found",
  "Grupa nav atrasta.": "errors.group_not_found",
  "Grupa vai nosaukums nav norādīts.": "errors.group_or_name_required",
  "Grupu nevar dzēst, kamēr tai ir piesaistīti lietotāji.":
    "errors.group_has_users",
  "Grupa nav norādīta.": "errors.group_required",
  "Grupas nosaukums ir pārāk garš.": "errors.group_name_too_long",
  "Grupas nosaukums nav norādīts.": "errors.group_name_required",
  "Ievadi sistēmas nosaukumu.": "site_settings.validation.system_name_required",
  "Ievadi uzņēmuma nosaukumu.": "register_company.validation.name_required",
  "Ievadi tāmes derīguma termiņu dienās.":
    "settings.validation.estimate_validity_required",
  "Uzņēmuma nosaukums ir pārāk garš.": "errors.company_name_too_long",
  "Tu jau esi piesaistīts uzņēmumam.": "errors.company_already_member",
  "Tev jau ir gaidošs uzņēmuma uzaicinājums.":
    "errors.pending_company_invite",
  "Neizdevās izveidot uzņēmumu.": "errors.company_create_failed",
  "Neizdevās saglabāt uzņēmuma iestatījumus.": "errors.company_settings_create_failed",
  "Neizdevās piesaistīt lietotāju uzņēmumam.": "errors.company_user_attach_failed",
  "Neizdevās saglabāt lietotāja profilu.": "errors.company_user_profile_save_failed",
  "Sistēmas administrators uzņēmumu šeit neveido.":
    "errors.system_admin_cannot_register_company",
  "Ievadi sistēmas sloganu.": "site_settings.validation.slogan_required",
  "Ievadi derīgu pārziņa e-pasta adresi.":
    "site_settings.validation.controller_email_invalid",
  "Ievadi nosaukumu.": "validation.name_required",
  "Ievadi e-pasta adresi.": "validation.email_required",
  "Ievadi derīgu e-pasta adresi.": "validation.email_invalid",
  "Ievadi derīgu telefona numuru.": "validation.phone_invalid",
  "Ievadi mērvienību.": "validation.unit_required",
  "Ievadi pasūtītāja vārdu un uzvārdu.": "errors.client_name_required",
  "Ievadi adresi.": "validation.address_required",
  "Izvēlies attēlu.": "errors.image_required",
  "Izvēlies failu.": "errors.file_required",
  "Izvēlies moduli.": "validation.module_required",
  "Izvēlies izmaksu veidu.": "validation.cost_type_required",
  "Izvēlētais modulis vairs neeksistē.": "errors.module_not_found",
  "Ievadi valodas nosaukumu.": "errors.language_name_required",
  "Ievadi moduļa atslēgu.": "frontend_modules.feedback.key_required",
  "Atslēgai jābūt formātā ar mazajiem burtiem, cipariem, punktiem, svītrām, apakšsvītrām un kolu.":
    "errors.frontend_module_key_invalid",
  "Modulis ar šo atslēgu jau eksistē.": "errors.frontend_module_key_exists",
  "Frontend modulis nav atrasts.": "errors.frontend_module_not_found",
  "Neizdevās izveidot frontend moduli.": "errors.frontend_module_create_failed",
  "Neizdevās dzēst frontend moduli.": "errors.frontend_module_delete_failed",
  "Neizdevās saglabāt moduļa statusu.": "errors.frontend_module_status_save_failed",
  "Key drīkst saturēt burtus, ciparus, punktus, svītras, apakšsvītras un kolus.":
    "errors.translation_key_invalid",
  "Nav autorizācijas.": "errors.unauthorized",
  "Nav tiesību.": "errors.forbidden",
  "Nosaukums ir pārāk garš.": "errors.name_too_long",
  "Logotips nedrīkst būt lielāks par 2 MB.": "errors.logo_too_large",
  "Nevar liegt pieeju pašam sev.": "errors.user_cannot_disable_self",
  "Neatbalstīts attēla formāts.": "errors.image_format_unsupported",
  "Neizdevās atjaunot lietotāja pieeju.": "errors.user_access_restore_failed",
  "Neizdevās dzēst grupu.": "errors.group_delete_failed",
  "Neizdevās dzēst pozīciju.": "errors.position_delete_failed",
  "Neizdevās dzēst tulkojumu.": "errors.translation_delete_failed",
  "Neizdevās dzēst valodu.": "errors.language_delete_failed",
  "Neizdevās izveidot grupu.": "errors.group_create_failed",
  "Neizdevās izveidot tulkojumu.": "errors.translation_create_failed",
  "Neizdevās izveidot valodu.": "errors.language_create_failed",
  "Neizdevās izveidot projektu.": "errors.project_create_failed",
  "Neizdevās izveidot tāmi.": "errors.estimate_create_failed",
  "Neizdevās ielādēt projektus laika normu sinhronizācijai.":
    "errors.labor_norm_projects_load_failed",
  "Neizdevās ielādēt projektu tāmes laika normu sinhronizācijai.":
    "errors.labor_norm_estimates_load_failed",
  "Neizdevās dzēst moduli.": "errors.module_delete_failed",
  "Neizdevās pievienot moduli.": "errors.module_create_failed",
  "Neizdevās nokopēt moduli.": "errors.module_copy_failed",
  "Neizdevās nokopēt moduļa failus.": "errors.module_files_copy_failed",
  "Neizdevās pievienot pozīciju.": "errors.position_create_failed",
  "Neizdevās pievienot tāmes pozīciju.": "errors.estimate_position_create_failed",
  "Neizdevās saglabāt moduli.": "errors.module_save_failed",
  "Neizdevās saglabāt bloku secību.": "errors.block_order_save_failed",
  "Neizdevās saglabāt datumus.": "errors.estimate_dates_save_failed",
  "Neizdevās saglabāt plānoto peļņu.": "errors.planned_profit_save_failed",
  "Neizdevās saglabāt projekta aprakstu.":
    "errors.project_description_save_failed",
  "Neizdevās saglabāt secību.": "errors.sort_order_save_failed",
  "Nav projektu secībai.": "errors.timeline_graph_projects_required",
  "Nederīgs cilvēku skaits.": "errors.timeline_graph_people_count_invalid",
  "Neizdevās saglabāt cilvēku skaitu.": "errors.timeline_graph_people_count_save_failed",
  "Nevar sapārot šos darbus.": "errors.timeline_graph_parallel_invalid",
  "Nevar sapārot ar citu projektu — paralēli tikai tajā pašā projektā.":
    "errors.timeline_graph_parallel_cross_project",
  "Neizdevās saglabāt paralēlo sapārojumu.": "errors.timeline_graph_parallel_save_failed",
  "Neizdevās saglabāt tāmes pozīciju.":
    "errors.estimate_position_save_failed",
  "Neizdevās augšupielādēt failu.": "errors.file_upload_failed",
  "Neizdevās augšupielādēt logotipu.": "errors.logo_upload_failed",
  "Neizdevās liegt pieeju lietotājam.": "errors.user_access_disable_failed",
  "Neizdevās noņemt lietotāju no uzņēmuma.":
    "errors.company_user_remove_failed",
  "Neizdevās saglabāt noklusējuma valodu.": "errors.default_language_save_failed",
  "Neizdevās saglabāt sistēmas grupas tiesības.":
    "errors.site_group_permissions_save_failed",
  "Neizdevās saglabāt sistēmas uzstādījumus.":
    "errors.site_settings_save_failed",
  "Neizdevās saglabāt logotipu.": "errors.site_logo_save_failed",
  "Neizdevās saglabāt favicon.": "errors.site_favicon_save_failed",
  "Neizdevās augšupielādēt favicon.": "errors.site_favicon_upload_failed",
  "Neizdevās saglabāt tulkojumu.": "errors.translation_save_failed",
  "Neizdevās saglabāt valodas statusu.": "errors.language_status_save_failed",
  "Neizdevās saglabāt valodu.": "errors.language_save_failed",
  "Neizdevās saglabāt grupas nosaukumu.": "errors.group_name_save_failed",
  "Neizdevās saglabāt grupas tiesības.": "errors.group_permissions_save_failed",
  "Neizdevās saglabāt projektu.": "errors.project_save_failed",
  "Neizdevās saglabāt iestatījumus.": "errors.settings_save_failed",
  "Neizdevās saglabāt cenu.": "errors.price_save_failed",
  "Neizdevās saglabāt cenu vēsturē.": "errors.price_history_save_failed",
  "Neizdevās saglabāt pozīciju.": "errors.position_save_failed",
  "Neizdevās saglabāt tāmi.": "errors.estimate_save_failed",
  "Neizdevās dzēst papildu darbu tāmi.": "errors.additional_work_delete_failed",
  "Papildu darbu tāme nav atrasta.": "errors.additional_work_not_found",
  "Neizdevās izveidot papildu darbu tāmi.": "errors.additional_work_create_failed",
  "Neizdevās saglabāt papildu darbu tāmi.": "errors.additional_work_save_failed",
  "Neizdevās nosūtīt uzaicinājumu.": "errors.invitation_send_failed",
  "Uzaicinājuma e-pastu var sūtīt pārāk bieži. Uzgaidi minūti un mēģini vēlreiz.":
    "errors.invitation_rate_limited",
  "E-pasta reģistrācija pieejama tikai ar ieslēgtu Resend.":
    "auth.email.resend_required",
  "E-pasta apstiprinājums pieejams tikai ar ieslēgtu Resend.":
    "auth.email.resend_required",
  "Šis e-pasts jau ir reģistrēts. Pieraksties ar paroli.":
    "auth.email.already_registered",
  "Neizdevās nosūtīt apstiprinājuma e-pastu.":
    "auth.email.confirmation_send_failed",
  "Konts ar šo e-pastu nav atrasts.": "auth.email.account_not_found",
  "E-pasts jau ir apstiprināts. Vari pierakstīties.":
    "auth.email.already_confirmed",
  "Parolei jābūt vismaz 8 rakstzīmēm.": "auth.email.password_min",
  "Ievadi paroli.": "auth.email.password_required",
  "Neizdevās saglabāt uzņēmuma moduļa statusu.":
    "errors.company_module_status_save_failed",
  "Modulis nav globāli ieslēgts un to nevar piešķirt uzņēmumam.":
    "errors.company_module_global_off",
  "Plānotās peļņas modulis nav pieejams.": "errors.profit_module_disabled",
  "Materiālu pasūtīšanas modulis nav pieejams.":
    "errors.delegated_orders_module_disabled",
  "Uzņēmums nav norādīts.": "errors.company_required",
  "Neizdevās pievienot lietotāju uzņēmumam.":
    "errors.user_company_add_failed",
  "Lietotājs jau ir šajā uzņēmumā.": "errors.user_already_in_company",
  "Neizdevās piešķirt grupu.": "errors.group_assign_failed",
  "Neizdevās atjaunināt pozīciju.": "errors.position_update_failed",
  "Neizdevās atjaunināt projekta statusu.":
    "errors.project_status_update_failed",
  "Neizdevās atzīmēt materiālu kā pasūtītu.":
    "errors.material_mark_ordered_failed",
  "Neizdevās noņemt pozīciju no projekta.":
    "errors.project_position_omit_failed",
  "Neizdevās pārbaudīt grupas lietotājus.":
    "errors.group_users_check_failed",
  "Neizdevās piešķirt materiālu lietotājam.":
    "errors.material_assign_failed",
  "Neizdevās sinhronizēt laika normu citos projektos.":
    "errors.labor_norm_sync_failed",
  "Noklusējuma valodu nevar deaktivizēt.":
    "errors.default_language_cannot_deactivate",
  "Noklusējuma valodu nevar dzēst.": "errors.default_language_cannot_delete",
  "Sistēmas profilu tiesības var mainīt tikai sistēmas administrators.":
    "errors.system_profile_permissions_admin_only",
  "Tulkojums ar šo key jau eksistē.": "errors.translation_key_exists",
  "Tulkojums nav norādīts.": "errors.translation_required",
  "Tāme ir apstiprināta un to vairs nevar labot.":
    "errors.estimate_approved_locked",
  "Tāme nav atrasta.": "errors.estimate_not_found",
  "Modulis nav atrasts.": "errors.module_not_found",
  "Projekts nav atrasts.": "errors.project_not_found",
  "Uzņēmums nav atrasts.": "errors.company_not_found",
  "Valoda ar šo kodu jau eksistē.": "errors.language_code_exists",
  "Valoda nav atrasta.": "errors.language_not_found",
  "Valoda nav atrasta vai nav aktīva.": "errors.language_not_active",
  "Valoda nav norādīta.": "errors.language_required",
  "Valoda saglabāta, bet veco kodu neizdevās noņemt.":
    "errors.language_old_code_remove_failed",
  "Valodas kodam jābūt formātā lv, en vai en-US.":
    "errors.language_code_invalid",
  "Vizualizācijām atbalstīti tikai attēli (PNG, JPG, WEBP, GIF).":
    "errors.visualization_image_format",
  "PDF fails nedrīkst būt lielāks par 20 MB.": "errors.pdf_too_large",
  "Projekta sadaļai atbalstīti tikai PDF faili.": "errors.project_file_pdf_only",
  "Kopējot projektu, moduli nevar mainīt.": "errors.copy_project_module_locked",
  "Lietotāju var piešķirt tikai apstiprinātam projektam.":
    "errors.material_assign_requires_approved_project",
  "Lietotājs ar šo e-pastu jau ir reģistrēts.": "errors.user_email_exists",
  "Lietotājs nav norādīts.": "errors.user_required",
  "Lietotājs vai grupa nav norādīta.": "errors.user_or_group_required",
  "Sistēmas grupas nosaukumu nevar mainīt.": "errors.system_group_rename_forbidden",
  "Sistēmas grupu nevar dzēst.": "errors.system_group_delete_forbidden",
  "SVG fails nav derīgs.": "errors.svg_invalid",
  "Fails neatbilst deklarētajam WebP formātam.":
    "errors.webp_magic_bytes_mismatch",
  "Faila saturs neatbilst deklarētajam formātam.":
    "errors.file_magic_bytes_mismatch",
  "Materiāls nav norādīts.": "errors.material_required",
  "Materiālu pasūtīšanu var atzīmēt tikai apstiprinātam projektam.":
    "errors.material_order_requires_approved_project",
  "Pozīcija nav norādīta.": "errors.position_required",
  "Projekta statuss vēl nav pieejams. Palaid npm run db:migrate.":
    "errors.project_status_migration_required",
  "Projekts jau ir noraidīts.": "errors.project_already_rejected",
  "Projektu nevar apstiprināt šajā statusā.":
    "errors.project_approve_status_invalid",
  "Projektu nevar atzīmēt kā pabeigtu šajā statusā.":
    "errors.project_complete_status_invalid",
  "Pārāk daudz pieprasījumu. Mēģini vēlāk.": "errors.rate_limit",
  "Ievadi vārdu.": "workers.validation.first_name_required",
  "Ievadi uzvārdu.": "workers.validation.last_name_required",
  "Ievadi instrumenta numuru.": "tools.validation.number_required",
  "Ievadi instrumenta nosaukumu.": "tools.validation.name_required",
  "Instruments ar šo numuru jau eksistē.": "errors.tool_number_exists",
  "Foto nedrīkst būt lielāks par 5 MB.": "errors.worker_photo_too_large",
  "Neizdevās pievienot darbinieku.": "errors.worker_create_failed",
  "Neizdevās saglabāt darbinieku.": "errors.worker_save_failed",
  "Neizdevās dzēst darbinieku.": "errors.worker_delete_failed",
  "Neizdevās pievienot instrumentu.": "errors.tool_create_failed",
  "Neizdevās saglabāt instrumentu.": "errors.tool_save_failed",
  "Neizdevās dzēst instrumentu.": "errors.tool_delete_failed",
  "Neizdevās ielādēt instrumenta vēsturi.":
    "errors.tool_history_load_failed",
};

export function translateActionError(
  t: Translate,
  result: ActionErrorLike,
): string {
  const key = result.errorKey ?? ERROR_KEYS_BY_TEXT[result.error];
  return key ? t(key, result.error, result.errorParams) : result.error;
}
