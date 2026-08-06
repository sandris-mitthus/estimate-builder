-- Uzņēmuma reģistrācijas (onboarding) UI tulkojumi lietotājiem bez company_users membership.

with translations (translation_key, namespace, description, lv, en) as (
  values
    (
      'register_company.title',
      'register_company',
      'Company registration page title',
      'Reģistrē savu uzņēmumu',
      'Register your company'
    ),
    (
      'register_company.description',
      'register_company',
      'Company registration page description',
      'Lai lietotu sistēmu, tev jābūt piesaistītam uzņēmumam. Aizpildi pamata datus — pārējo vari papildināt vēlāk iestatījumos.',
      'To use the system you must belong to a company. Enter the basic details — you can complete the rest later in settings.'
    ),
    (
      'register_company.form.company_name',
      'register_company',
      'Company name field',
      'Uzņēmuma nosaukums',
      'Company name'
    ),
    (
      'register_company.form.registration_number',
      'register_company',
      'Company registration number field',
      'Reģistrācijas numurs',
      'Registration number'
    ),
    (
      'register_company.form.address',
      'register_company',
      'Company address field',
      'Adrese',
      'Address'
    ),
    (
      'register_company.form.email',
      'register_company',
      'Company email field',
      'E-pasts',
      'Email'
    ),
    (
      'register_company.form.phone',
      'register_company',
      'Company phone field',
      'Telefons',
      'Phone'
    ),
    (
      'register_company.actions.create',
      'register_company',
      'Create company submit button',
      'Izveidot uzņēmumu',
      'Create company'
    ),
    (
      'register_company.validation.name_required',
      'register_company',
      'Company name required validation',
      'Ievadi uzņēmuma nosaukumu.',
      'Enter the company name.'
    ),
    (
      'register_company.feedback.created',
      'register_company',
      'Company created success toast',
      'Uzņēmums izveidots. Vari sākt darbu.',
      'Company created. You can start working.'
    ),
    (
      'errors.company_already_member',
      'errors',
      'User already belongs to a company',
      'Tu jau esi piesaistīts uzņēmumam.',
      'You already belong to a company.'
    ),
    (
      'errors.company_create_failed',
      'errors',
      'Failed to create company',
      'Neizdevās izveidot uzņēmumu.',
      'Failed to create company.'
    ),
    (
      'errors.company_settings_create_failed',
      'errors',
      'Failed to create company settings during registration',
      'Neizdevās saglabāt uzņēmuma iestatījumus.',
      'Failed to save company settings.'
    ),
    (
      'errors.company_user_attach_failed',
      'errors',
      'Failed to attach user to new company',
      'Neizdevās piesaistīt lietotāju uzņēmumam.',
      'Failed to attach the user to the company.'
    ),
    (
      'errors.company_user_profile_save_failed',
      'errors',
      'Failed to upsert user profile during company registration',
      'Neizdevās saglabāt lietotāja profilu.',
      'Failed to save the user profile.'
    ),
    (
      'errors.system_admin_cannot_register_company',
      'errors',
      'System admin cannot use company self-registration',
      'Sistēmas administrators uzņēmumu šeit neveido.',
      'System administrators do not register a company here.'
    ),
    (
      'errors.company_name_too_long',
      'errors',
      'Company name too long',
      'Uzņēmuma nosaukums ir pārāk garš.',
      'The company name is too long.'
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
