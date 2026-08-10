-- Password reset UI + Resend email template (admin editable).

with translations (translation_key, namespace, description, lv, en) as (
  values
    (
      'email.password_reset.subject',
      'email',
      'Subject for password reset email',
      'Atjauno paroli — {system}',
      'Reset your password — {system}'
    ),
    (
      'email.password_reset.body',
      'email',
      'Body for password reset email',
      'Sveiki, {name}!

Saņēmām pieprasījumu atjaunot paroli sistēmā {system}.

Nospied pogu zemāk, lai izvēlētos jaunu paroli. Ja tu to nepieprasīji, vari ignorēt šo e-pastu.',
      'Hello, {name}!

We received a request to reset your password for {system}.

Press the button below to choose a new password. If you did not request this, you can ignore this email.'
    ),
    (
      'email.password_reset.button',
      'email',
      'CTA button on password reset email',
      'Atjaunot paroli',
      'Reset password'
    ),
    (
      'email.password_reset.footer_hint',
      'email',
      'Footer hint under password reset CTA',
      'Ja poga nedarbojas, atver šo saiti pārlūkā:',
      'If the button does not work, open this link in your browser:'
    ),
    (
      'site_email_templates.template.password_reset',
      'site_email_templates',
      'Password reset template tab',
      'Paroles atjaunošana',
      'Password reset'
    ),
    (
      'auth.email.forgot_password',
      'auth',
      'Forgot password link on login',
      'Aizmirsi paroli?',
      'Forgot password?'
    ),
    (
      'auth.forgot.title',
      'auth',
      'Forgot password page title',
      'Atjaunot paroli',
      'Reset password'
    ),
    (
      'auth.forgot.subtitle',
      'auth',
      'Forgot password page subtitle',
      'Ievadi e-pastu — nosūtīsim saiti paroles atjaunošanai.',
      'Enter your email and we will send a password reset link.'
    ),
    (
      'auth.forgot.submit',
      'auth',
      'Forgot password submit button',
      'Nosūtīt saiti',
      'Send link'
    ),
    (
      'auth.forgot.check_email.title',
      'auth',
      'Forgot password success title',
      'Pārbaudi e-pastu',
      'Check your email'
    ),
    (
      'auth.forgot.check_email.description',
      'auth',
      'Forgot password success description',
      'Ja konts ar adresi {email} eksistē, nosūtījām paroles atjaunošanas saiti.',
      'If an account exists for {email}, we sent a password reset link.'
    ),
    (
      'auth.forgot.back_to_login',
      'auth',
      'Back to login from forgot password',
      'Atpakaļ uz pierakstīšanos',
      'Back to sign in'
    ),
    (
      'auth.reset.title',
      'auth',
      'Set new password page title',
      'Jauna parole',
      'New password'
    ),
    (
      'auth.reset.subtitle',
      'auth',
      'Set new password page subtitle',
      'Izvēlies jaunu paroli savam kontam.',
      'Choose a new password for your account.'
    ),
    (
      'auth.reset.submit',
      'auth',
      'Save new password button',
      'Saglabāt paroli',
      'Save password'
    ),
    (
      'auth.reset.success',
      'auth',
      'Password updated success toast',
      'Parole atjaunota. Vari pierakstīties.',
      'Password updated. You can sign in.'
    ),
    (
      'auth.reset.session_required',
      'auth',
      'Reset password without recovery session',
      'Atjaunošanas saite nav derīga vai ir beigusies. Pieprasi jaunu saiti.',
      'The reset link is invalid or has expired. Request a new link.'
    ),
    (
      'auth.reset.update_failed',
      'auth',
      'Failed to update password',
      'Neizdevās saglabāt jauno paroli.',
      'Could not save the new password.'
    ),
    (
      'auth.email.password_reset_resend_required',
      'auth',
      'Password reset requires Resend',
      'Paroles atjaunošana pieejama tikai ar ieslēgtu Resend.',
      'Password reset is available only when Resend is enabled.'
    ),
    (
      'auth.email.password_reset_send_failed',
      'auth',
      'Failed to send password reset email',
      'Neizdevās nosūtīt paroles atjaunošanas e-pastu.',
      'Failed to send the password reset email.'
    )
)
insert into public.site_translations as t (
  translation_key,
  namespace,
  description,
  values
)
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
  values = t.values || excluded.values,
  updated_at = now();
