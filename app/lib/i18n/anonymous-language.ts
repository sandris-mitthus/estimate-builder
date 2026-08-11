import { cookies } from "next/headers";
import { detectCountryIsoFromRequest } from "@/app/lib/geo/detect-country";
import { ANONYMOUS_LANGUAGE_COOKIE } from "@/app/lib/i18n/language-cookie";
import { getDefaultSiteLanguageCode } from "@/app/lib/site-admin/repository";

/**
 * Anonymous UI language:
 * 1) `eb_language` cookie (explicit choice)
 * 2) visitor country LV → `lv` if active
 * 3) other countries → `en` if active
 * 4) system default / first active language
 */
export function resolveAnonymousLanguageCode(input: {
  activeCodes: Iterable<string>;
  cookieCode: string;
  defaultCode: string;
  countryIso: string | null;
  fallbackCode?: string;
}): string {
  const active = new Set(
    [...input.activeCodes].map((code) => code.trim().toLowerCase()),
  );
  const cookie = input.cookieCode.trim().toLowerCase();
  if (cookie && active.has(cookie)) {
    return cookie;
  }

  const country = input.countryIso?.trim().toUpperCase() ?? "";
  if (country === "LV" && active.has("lv")) {
    return "lv";
  }
  if (country && country !== "LV" && active.has("en")) {
    return "en";
  }

  const defaultCode = input.defaultCode.trim().toLowerCase();
  if (defaultCode && active.has(defaultCode)) {
    return defaultCode;
  }

  const fallback = input.fallbackCode?.trim().toLowerCase() ?? "";
  if (fallback && active.has(fallback)) {
    return fallback;
  }

  return [...active][0] ?? "lv";
}

export async function getAnonymousActiveLanguageCode(
  languages: { code: string }[],
): Promise<string> {
  const activeCodes = languages.map((language) => language.code);
  const [cookieStore, defaultCode, countryIso] = await Promise.all([
    cookies(),
    getDefaultSiteLanguageCode(),
    detectCountryIsoFromRequest(),
  ]);
  const cookieCode =
    cookieStore.get(ANONYMOUS_LANGUAGE_COOKIE)?.value?.trim() ?? "";

  return resolveAnonymousLanguageCode({
    activeCodes,
    cookieCode,
    defaultCode,
    countryIso,
    fallbackCode: languages[0]?.code,
  });
}
