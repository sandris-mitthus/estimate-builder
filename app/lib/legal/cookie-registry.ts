import type { CookieConsentCategory } from "@/app/lib/consent/cookie-consent";
import type { TranslationParams } from "@/app/lib/i18n/translations";

type Translate = (
  key: string,
  fallback?: string,
  params?: TranslationParams,
) => string;

export type CookieRegistryRow = {
  name: string;
  category: string;
  purpose: string;
  retention: string;
};

type CookieRegistryEntry = {
  name: string;
  category: CookieConsentCategory;
  purposeKey: string;
  purposeFallback: string;
  retentionKey: string;
  retentionFallback: string;
};

const CATEGORY_LABELS: Record<
  CookieConsentCategory,
  { key: string; fallback: string }
> = {
  necessary: {
    key: "cookie_consent.category.necessary.title",
    fallback: "Obligātās sīkdatnes",
  },
  preferences: {
    key: "cookie_consent.category.preferences.title",
    fallback: "Preferenču sīkdatnes",
  },
  analytics: {
    key: "cookie_consent.category.analytics.title",
    fallback: "Statistikas sīkdatnes",
  },
  marketing: {
    key: "cookie_consent.category.marketing.title",
    fallback: "Mārketinga sīkdatnes",
  },
};

const COOKIE_REGISTRY: CookieRegistryEntry[] = [
  {
    name: "sb-<projekts>-auth-token",
    category: "necessary",
    purposeKey: "legal.cookies.table.auth_token.purpose",
    purposeFallback:
      "Uztur pieslēgšanās sesiju, lai nebūtu jāpieslēdzas atkārtoti katrā lapā.",
    retentionKey: "legal.cookies.table.auth_token.retention",
    retentionFallback: "Līdz izrakstīšanās brīdim vai sesijas beigām",
  },
  {
    name: "sb-<projekts>-auth-token-code-verifier",
    category: "necessary",
    purposeKey: "legal.cookies.table.code_verifier.purpose",
    purposeFallback:
      "Nodrošina drošu Google pieslēgšanās plūsmu (OAuth PKCE pārbaude).",
    retentionKey: "legal.cookies.table.code_verifier.retention",
    retentionFallback: "Tikai pieslēgšanās laikā",
  },
  {
    name: "eb_cookie_consent",
    category: "necessary",
    purposeKey: "legal.cookies.table.consent.purpose",
    purposeFallback:
      "Saglabā tavu izvēli par sīkdatņu kategorijām, lai paziņojums netiktu rādīts atkārtoti.",
    retentionKey: "legal.cookies.table.consent.retention",
    retentionFallback: "6 mēneši",
  },
  {
    name: "eb_language",
    category: "necessary",
    purposeKey: "legal.cookies.table.language.purpose",
    purposeFallback:
      "Atceras tavu izvēlēto saskarnes valodu pirms pieslēgšanās.",
    retentionKey: "legal.cookies.table.language.retention",
    retentionFallback: "12 mēneši",
  },
  {
    name: "eb_sidebar_collapsed",
    category: "preferences",
    purposeKey: "legal.cookies.table.sidebar.purpose",
    purposeFallback: "Atceras, vai kreisā navigācijas josla ir sakļauta.",
    retentionKey: "legal.cookies.table.sidebar.retention",
    retentionFallback: "12 mēneši",
  },
  {
    name: "eb_estimate_collapsed_<tāme>",
    category: "preferences",
    purposeKey: "legal.cookies.table.estimate_collapsed.purpose",
    purposeFallback:
      "Atceras, kuras tāmes kategorijas un apakškategorijas ir sakļautas.",
    retentionKey: "legal.cookies.table.estimate_collapsed.retention",
    retentionFallback: "12 mēneši",
  },
  {
    name: "eb_assigned_materials_banner_collapsed_<lietotājs>",
    category: "preferences",
    purposeKey: "legal.cookies.table.materials_banner.purpose",
    purposeFallback:
      "Atceras, vai piešķirto materiālu paziņojumu josla ir sakļauta.",
    retentionKey: "legal.cookies.table.materials_banner.retention",
    retentionFallback: "12 mēneši",
  },
  {
    name: "umami",
    category: "analytics",
    purposeKey: "legal.cookies.table.umami.purpose",
    purposeFallback:
      "Anonīma lapu apmeklējumu un lietojuma statistika (Umami Cloud), lai uzlabotu sistēmu.",
    retentionKey: "legal.cookies.table.umami.retention",
    retentionFallback: "Līdz 24 mēnešiem vai līdz piekrišanas atsaukšanai",
  },
  {
    name: "local storage: estimate-builder-system-admin-todo-list",
    category: "necessary",
    purposeKey: "legal.cookies.table.todo_storage.purpose",
    purposeFallback:
      "Glabā sistēmas administratora uzdevumu saraksta saturu tavā pārlūkā. Nepieciešams, lai attiecīgā funkcija darbotos.",
    retentionKey: "legal.cookies.table.todo_storage.retention",
    retentionFallback: "Līdz pārlūka datu notīrīšanai",
  },
];

export function getCookieRegistryRows(t: Translate): CookieRegistryRow[] {
  return COOKIE_REGISTRY.map((entry) => {
    const categoryLabel = CATEGORY_LABELS[entry.category];

    return {
      name: entry.name,
      category: t(categoryLabel.key, categoryLabel.fallback),
      purpose: t(entry.purposeKey, entry.purposeFallback),
      retention: t(entry.retentionKey, entry.retentionFallback),
    };
  });
}
