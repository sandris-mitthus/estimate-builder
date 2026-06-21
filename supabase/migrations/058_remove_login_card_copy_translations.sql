-- Remove login copy translations that now come from site settings or are no longer shown.

delete from public.site_translations
where translation_key in (
  'auth.login.brand',
  'auth.login.slogan',
  'auth.login.title',
  'auth.login.trial_note'
);
