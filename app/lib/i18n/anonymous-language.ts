import { cookies } from "next/headers";
import { detectCountryIsoFromRequest } from "@/app/lib/geo/detect-country";
import { matchActiveLanguageForCountry } from "@/app/lib/i18n/country-language";
import { ANONYMOUS_LANGUAGE_COOKIE } from "@/app/lib/i18n/language-cookie";
import { getDefaultSiteLanguageCode } from "@/app/lib/site-admin/repository";

/**
 * Anonymous UI language:
 * 1) `eb_language` cookie (explicit choice)
 * 2) visitor country → matching active language (RU→ru, FI→fi, SE→sv, …)
 * 3) `en` if active (international fallback)
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

  const fromCountry = matchActiveLanguageForCountry(input.countryIso, active);
  if (fromCountry) {
    return fromCountry;
  }

  if (input.countryIso?.trim() && active.has("en")) {
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
  const activeSet = new Set(
    activeCodes.map((code) => code.trim().toLowerCase()),
  );
  const cookieStore = await cookies();
  const cookieCode =
    cookieStore.get(ANONYMOUS_LANGUAGE_COOKIE)?.value?.trim() ?? "";

  // Cookie already resolves language — skip geo/IP lookup for TTFB.
  if (cookieCode && activeSet.has(cookieCode.toLowerCase())) {
    return cookieCode.toLowerCase();
  }

  const [defaultCode, countryIso] = await Promise.all([
    getDefaultSiteLanguageCode(),
    detectCountryIsoFromRequest(),
  ]);

  return resolveAnonymousLanguageCode({
    activeCodes,
    cookieCode: "",
    defaultCode,
    countryIso,
    fallbackCode: languages[0]?.code,
  });
}
