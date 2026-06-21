-- Seed additional company settings translations.

with translations (translation_key, namespace, description, lv, en) as (
  values
    ('common.days_count', 'common', '', '{count} dienas', '{count} days'),
    ('common.optional', 'common', '', 'Nav obligāts', 'Optional'),
    ('files.choose_file', 'files', '', 'izvēlies failu', 'choose a file'),

    ('settings.company_logo', 'settings', '', 'Uzņēmuma logotips', 'Company logo'),
    ('settings.preview.empty', 'settings', '', 'Aizpildi laukus, lai redzētu uzņēmuma datus.', 'Fill in the fields to preview company details.'),
    ('settings.currency', 'settings', '', 'Valūta', 'Currency'),
    ('settings.estimate_validity', 'settings', '', 'Tāmes derīgums', 'Estimate validity'),
    ('settings.hourly_rate', 'settings', '', 'Stundas likme', 'Hourly rate'),
    ('settings.preview.vat_hidden', 'settings', '', 'PVN numurs netiks rādīts, kamēr lauks ir tukšs.', 'VAT number will not be shown while the field is empty.'),
    ('settings.preview.offer_notes', 'settings', '', 'Piedāvājuma piezīmes', 'Offer notes'),
    ('settings.preview.offer_validity', 'settings', '', 'Piedāvājums spēkā {count} dienas', 'Offer valid for {count} days'),
    ('settings.validation.estimate_validity_required', 'settings', '', 'Ievadi tāmes derīguma termiņu dienās.', 'Enter estimate validity in days.'),
    ('settings.validation.offer_validity_required', 'settings', '', 'Ievadi piedāvājuma derīguma termiņu dienās.', 'Enter offer validity in days.'),
    ('settings.validation.hourly_rate_invalid', 'settings', '', 'Ievadi derīgu stundas likmi.', 'Enter a valid hourly rate.'),
    ('settings.feedback.saved', 'settings', '', 'Uzstādījumi saglabāti.', 'Settings saved.'),
    ('settings.section.company', 'settings', '', 'Uzņēmums', 'Company'),
    ('settings.company_name', 'settings', '', 'Uzņēmuma nosaukums', 'Company name'),
    ('settings.address', 'settings', '', 'Adrese', 'Address'),
    ('settings.registration_number', 'settings', '', 'Reģistrācijas numurs', 'Registration number'),
    ('settings.vat_number', 'settings', '', 'PVN numurs', 'VAT number'),
    ('settings.section.bank', 'settings', '', 'Bankas rekvizīti', 'Bank details'),
    ('settings.bank_account_number', 'settings', '', 'Bankas konta numurs', 'Bank account number'),
    ('settings.bank_name', 'settings', '', 'Bankas nosaukums', 'Bank name'),
    ('settings.section.estimate', 'settings', '', 'Tāme', 'Estimate'),
    ('settings.estimate_validity_term', 'settings', '', 'Tāmes derīguma termiņš', 'Estimate validity period'),
    ('settings.default_hourly_rate', 'settings', '', 'Darbinieka standarta stundas likme', 'Default employee hourly rate'),
    ('settings.section.offer', 'settings', '', 'Piedāvājums', 'Offer'),
    ('settings.offer_validity_term', 'settings', '', 'Piedāvājuma derīguma termiņš', 'Offer validity period'),
    ('settings.offer_validity_hint', 'settings', '', 'PDF rāda treknrakstā: „Piedāvājums spēkā X dienas”.', 'The PDF shows in bold: "Offer valid for X days".'),
    ('settings.offer_additional_info', 'settings', '', 'Papildus informācija piedāvājumam', 'Additional offer information'),
    ('settings.offer_additional_info_hint', 'settings', '', 'Katra rinda tiek rādīta kā atsevišķs komentārs piedāvājuma PDF.', 'Each line is shown as a separate comment in the offer PDF.'),
    ('settings.offer_additional_info_placeholder', 'settings', '', 'Pozīcijas, kas nav minētas piedāvājumā – nav iekļautas.\nPrecizējot un mainot pozīcijas cenas piedāvājums var tikt precizēts.', 'Items not mentioned in the offer are not included.\nIf item prices are clarified or changed, the offer may be adjusted.'),
    ('settings.section.contacts_currency', 'settings', '', 'Kontakti un valūta', 'Contacts and currency'),
    ('settings.info_phone', 'settings', '', 'Info telefons', 'Info phone'),
    ('settings.info_email', 'settings', '', 'Info e-pasts', 'Info email'),
    ('settings.logo_drop_hint_prefix', 'settings', '', 'Velc un nomet logotipu šeit vai', 'Drag and drop the logo here or'),
    ('settings.logo_remove', 'settings', '', 'Noņemt logotipu', 'Remove logo'),
    ('settings.logo_uploading', 'settings', '', 'Augšupielādē logotipu…', 'Uploading logo...'),

    ('errors.database_service_role_not_configured', 'errors', '', 'Datubāze nav konfigurēta. Pievieno SUPABASE_SERVICE_ROLE_KEY.', 'Database is not configured. Add SUPABASE_SERVICE_ROLE_KEY.'),
    ('errors.logo_format_supported', 'errors', '', 'Atbalstīti formāti: PNG, JPG, WEBP, SVG.', 'Supported formats: PNG, JPG, WEBP, SVG.'),
    ('errors.image_required', 'errors', '', 'Izvēlies attēlu.', 'Choose an image.')
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
