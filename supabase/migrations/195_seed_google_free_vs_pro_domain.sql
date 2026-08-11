-- Free vs Pro path for Google consent domain (supabase.co now, api.uupis.com later).

with translations (translation_key, namespace, description, lv, en) as (
  values
    (
      'site_integrations.google.mode_free_title',
      'site_integrations',
      'Current Free plan mode title',
      'Pašlaik: Free plāns',
      'Now: Free plan'
    ),
    (
      'site_integrations.google.mode_free_body',
      'site_integrations',
      'Current Free plan mode body',
      'Google login strādā ar Supabase noklusējuma hostu. Google ekrānā redzēsi „Pāriet uz lietotni …” ar {host}. Tas ir normāli — nekā nav jālauž.',
      'Google login works with the default Supabase host. On the Google screen you will see “Continue to …” with {host}. That is expected — nothing is broken.'
    ),
    (
      'site_integrations.google.mode_custom_title',
      'site_integrations',
      'Custom domain already active title',
      'Pašlaik: custom domain',
      'Now: custom domain'
    ),
    (
      'site_integrations.google.mode_custom_body',
      'site_integrations',
      'Custom domain already active body',
      'NEXT_PUBLIC_SUPABASE_URL jau ir custom host ({host}). Google „Pāriet uz lietotni” jārāda šis domēns.',
      'NEXT_PUBLIC_SUPABASE_URL already uses a custom host ({host}). Google “Continue to …” should show this domain.'
    ),
    (
      'site_integrations.google.consent_notice_title',
      'site_integrations',
      'Why Google shows supabase.co on account picker',
      'Kāpēc Google rāda …supabase.co?',
      'Why does Google show …supabase.co?'
    ),
    (
      'site_integrations.google.consent_notice_body',
      'site_integrations',
      'Explanation that Google shows the OAuth callback host',
      'Ekrānā „Pāriet uz lietotni …” Google rāda OAuth redirect URI hostu. Pašlaik tas ir {callback}. Free plānā Custom Domain nav pieejams, tāpēc host paliek *.supabase.co.',
      'On the “Continue to …” screen Google shows the OAuth redirect URI host. Right now that is {callback}. Custom Domains are not available on the Free plan, so the host stays *.supabase.co.'
    ),
    (
      'site_integrations.google.consent_fix_title',
      'site_integrations',
      'How to show api.uupis.com on Google consent',
      'Kad pāriesi uz maksas Supabase — soļi uz api.uupis.com',
      'When you move to paid Supabase — steps for api.uupis.com'
    ),
    (
      'site_integrations.google.consent_fix_1',
      'site_integrations',
      'Custom domain step 1',
      '1. Upgrade uz Pro (vai augstāku) → Settings → Add-ons → Custom Domain. DNS: CNAME api → tavs pašreizējais *.supabase.co. Host: api.uupis.com.',
      '1. Upgrade to Pro (or higher) → Settings → Add-ons → Custom Domain. DNS: CNAME api → your current *.supabase.co. Host: api.uupis.com.'
    ),
    (
      'site_integrations.google.consent_fix_2',
      'site_integrations',
      'Custom domain step 2',
      '2. Google Cloud → OAuth Client → Authorized redirect URIs pievieno https://api.uupis.com/auth/v1/callback (veco *.supabase.co/auth/v1/callback atstāj līdz pārejai).',
      '2. Google Cloud → OAuth Client → Authorized redirect URIs: add https://api.uupis.com/auth/v1/callback (keep *.supabase.co/auth/v1/callback until cutover).'
    ),
    (
      'site_integrations.google.consent_fix_3',
      'site_integrations',
      'Custom domain step 3',
      '3. Supabase: verify + activate custom domain. Pēc tam Google rādīs api.uupis.com.',
      '3. Supabase: verify + activate the custom domain. After that Google will show api.uupis.com.'
    ),
    (
      'site_integrations.google.consent_fix_4',
      'site_integrations',
      'Custom domain step 4 optional env',
      '4. Vercel: NEXT_PUBLIC_SUPABASE_URL=https://api.uupis.com → Redeploy. NEXT_PUBLIC_SITE_URL paliek https://uupis.com. Šīs lapas URL checklist atjaunosies automātiski.',
      '4. Vercel: NEXT_PUBLIC_SUPABASE_URL=https://api.uupis.com → Redeploy. Keep NEXT_PUBLIC_SITE_URL as https://uupis.com. This page’s URL checklist updates automatically.'
    ),
    (
      'site_integrations.google.planned_callback_label',
      'site_integrations',
      'Future api.uupis.com callback label',
      'Nākotnes Google callback (pēc Pro)',
      'Future Google callback (after Pro)'
    ),
    (
      'site_integrations.google.current_callback_label',
      'site_integrations',
      'Current Google callback label',
      'Pašreizējais Google callback (tagad)',
      'Current Google callback (now)'
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
