-- Email/password signup confirmation (Resend) + login UI translations.

with translations (translation_key, namespace, description, lv, en) as (
  values
    (
      'email.signup.subject',
      'email',
      'Subject for signup email confirmation',
      'Apstiprini e-pastu — {system}',
      'Confirm your email — {system}'
    ),
    (
      'email.signup.body',
      'email',
      'Body for signup email confirmation',
      'Sveiki, {name}!

Paldies, ka reģistrējies sistēmā {system}.

Nospied pogu zemāk, lai apstiprinātu e-pastu un aktivizētu kontu.',
      'Hello, {name}!

Thanks for signing up to {system}.

Press the button below to confirm your email and activate your account.'
    ),
    (
      'email.signup.button',
      'email',
      'Confirm button on signup email',
      'Apstiprināt e-pastu',
      'Confirm email'
    ),
    (
      'email.signup.footer_hint',
      'email',
      'Footer hint under signup CTA',
      'Ja poga nedarbojas, atver šo saiti pārlūkā:',
      'If the button does not work, open this link in your browser:'
    ),
    (
      'site_email_templates.template.signup',
      'site_email_templates',
      'Signup confirmation template tab',
      'Reģistrācijas apstiprinājums',
      'Signup confirmation'
    ),
    (
      'auth.email.tab_login',
      'auth',
      'Login tab on email auth form',
      'Pierakstīties',
      'Sign in'
    ),
    (
      'auth.email.tab_register',
      'auth',
      'Register tab on email auth form',
      'Reģistrēties',
      'Register'
    ),
    (
      'auth.email.email_label',
      'auth',
      'Email field label on login',
      'E-pasts',
      'Email'
    ),
    (
      'auth.email.password_label',
      'auth',
      'Password field label on login',
      'Parole',
      'Password'
    ),
    (
      'auth.email.confirm_password_label',
      'auth',
      'Confirm password field on register',
      'Atkārto paroli',
      'Confirm password'
    ),
    (
      'auth.email.login_submit',
      'auth',
      'Email login submit button',
      'Pierakstīties',
      'Sign in'
    ),
    (
      'auth.email.register_submit',
      'auth',
      'Email register submit button',
      'Izveidot kontu',
      'Create account'
    ),
    (
      'auth.email.or',
      'auth',
      'Divider between email form and Google',
      'vai',
      'or'
    ),
    (
      'auth.email.password_required',
      'auth',
      'Password required validation',
      'Ievadi paroli.',
      'Enter a password.'
    ),
    (
      'auth.email.password_min',
      'auth',
      'Password minimum length validation',
      'Parolei jābūt vismaz 8 rakstzīmēm.',
      'Password must be at least 8 characters.'
    ),
    (
      'auth.email.password_mismatch',
      'auth',
      'Password confirmation mismatch',
      'Paroles nesakrīt.',
      'Passwords do not match.'
    ),
    (
      'auth.email.register_sent',
      'auth',
      'Success after signup confirmation email sent',
      'Apstiprinājuma e-pasts nosūtīts. Atver saiti, lai aktivizētu kontu.',
      'Confirmation email sent. Open the link to activate your account.'
    ),
    (
      'auth.email.not_confirmed',
      'auth',
      'Login blocked until email is confirmed',
      'E-pasts vēl nav apstiprināts. Pārbaudi iesūtni vai nosūti apstiprinājumu vēlreiz.',
      'Email is not confirmed yet. Check your inbox or resend the confirmation.'
    ),
    (
      'auth.email.resend_confirmation',
      'auth',
      'Resend confirmation email link',
      'Nosūtīt apstiprinājuma e-pastu vēlreiz',
      'Resend confirmation email'
    ),
    (
      'auth.email.resend_sent',
      'auth',
      'Success after resending confirmation',
      'Apstiprinājuma e-pasts nosūtīts vēlreiz.',
      'Confirmation email sent again.'
    ),
    (
      'auth.email.invalid_credentials',
      'auth',
      'Wrong email or password',
      'Nepareizs e-pasts vai parole.',
      'Incorrect email or password.'
    ),
    (
      'auth.email.already_registered',
      'auth',
      'Email already registered',
      'Šis e-pasts jau ir reģistrēts. Pieraksties ar paroli.',
      'This email is already registered. Sign in with your password.'
    ),
    (
      'auth.email.confirmation_send_failed',
      'auth',
      'Failed to send signup confirmation email',
      'Neizdevās nosūtīt apstiprinājuma e-pastu.',
      'Failed to send the confirmation email.'
    ),
    (
      'auth.email.account_not_found',
      'auth',
      'No account for email on resend',
      'Konts ar šo e-pastu nav atrasts.',
      'No account found for this email.'
    ),
    (
      'auth.email.already_confirmed',
      'auth',
      'Email already confirmed',
      'E-pasts jau ir apstiprināts. Vari pierakstīties.',
      'Email is already confirmed. You can sign in.'
    ),
    (
      'auth.email.resend_required',
      'auth',
      'Email auth requires Resend enabled',
      'E-pasta reģistrācija pieejama tikai ar ieslēgtu Resend.',
      'Email registration is only available when Resend is enabled.'
    ),
    (
      'validation.email_required',
      'validation',
      'Required email empty',
      'Ievadi e-pasta adresi.',
      'Enter an email address.'
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
