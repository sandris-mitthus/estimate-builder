-- Clarify Google OAuth consent screen shows Supabase host until Custom Domain is set.

with translations (translation_key, namespace, description, lv, en) as (
  values
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
      'Ekrānā „Pāriet uz lietotni …” Google rāda OAuth redirect URI hostu. Pašlaik tas ir Supabase Auth callback ({callback}), tāpēc redzi project-ref.supabase.co — to nevar nomainīt tikai ar Vercel vai NEXT_PUBLIC_SITE_URL.',
      'On the “Continue to …” screen Google shows the OAuth redirect URI host. Right now that is the Supabase Auth callback ({callback}), so you see project-ref.supabase.co — changing Vercel or NEXT_PUBLIC_SITE_URL alone will not fix it.'
    ),
    (
      'site_integrations.google.consent_fix_title',
      'site_integrations',
      'How to show api.uupis.com on Google consent',
      'Kā rādīt api.uupis.com',
      'How to show api.uupis.com'
    ),
    (
      'site_integrations.google.consent_fix_1',
      'site_integrations',
      'Custom domain step 1',
      '1. Supabase paid plāns → Settings → Add-ons → Custom Domain. Iestati apakšdomēnu api.uupis.com (CNAME uz pašreizējo *.supabase.co).',
      '1. Supabase paid plan → Settings → Add-ons → Custom Domain. Set subdomain api.uupis.com (CNAME to your current *.supabase.co).'
    ),
    (
      'site_integrations.google.consent_fix_2',
      'site_integrations',
      'Custom domain step 2',
      '2. Google Cloud → OAuth Client → Authorized redirect URIs pievieno https://api.uupis.com/auth/v1/callback (veco supabase.co URI vari atstāt līdz pārejai).',
      '2. Google Cloud → OAuth Client → Authorized redirect URIs: add https://api.uupis.com/auth/v1/callback (keep the old supabase.co URI until cutover).'
    ),
    (
      'site_integrations.google.consent_fix_3',
      'site_integrations',
      'Custom domain step 3',
      '3. Aktivizē custom domain Supabase. Pēc tam Google konta izvēlē rādīs api.uupis.com.',
      '3. Activate the custom domain in Supabase. After that the Google account picker will show api.uupis.com.'
    ),
    (
      'site_integrations.google.consent_fix_4',
      'site_integrations',
      'Custom domain step 4 optional env',
      '4. (Ieteicams) Vercel: NEXT_PUBLIC_SUPABASE_URL=https://api.uupis.com un Redeploy. NEXT_PUBLIC_SITE_URL paliek https://uupis.com (lietotnes frontends).',
      '4. (Recommended) Vercel: NEXT_PUBLIC_SUPABASE_URL=https://api.uupis.com and Redeploy. Keep NEXT_PUBLIC_SITE_URL as https://uupis.com (app frontend).'
    ),
    (
      'site_integrations.google.consent_docs_link',
      'site_integrations',
      'Link label to Supabase custom domains docs',
      'Supabase Custom Domains dokumentācija',
      'Supabase Custom Domains documentation'
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
