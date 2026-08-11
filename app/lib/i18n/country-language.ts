/**
 * Maps ISO 3166-1 alpha-2 country → preferred UI language code
 * when they differ (SE≠sv, GB≠en, …).
 * Countries that already match the language code (RU→ru, FI→fi, DE→de)
 * need no entry — exact match is tried first.
 */
const COUNTRY_LANGUAGE_ALIASES: Record<string, string> = {
  // English-speaking
  GB: "en",
  US: "en",
  AU: "en",
  NZ: "en",
  IE: "en",
  CA: "en",
  // Nordic / Baltics where codes differ
  SE: "sv",
  NO: "nb",
  EE: "et",
  // Slavic / neighbours
  UA: "uk",
  BY: "be",
  CZ: "cs",
  SK: "sk",
  // Others with common mismatches
  GR: "el",
  DK: "da",
  JP: "ja",
  KR: "ko",
  CN: "zh",
  TW: "zh",
  HK: "zh",
  SA: "ar",
  AE: "ar",
  IL: "he",
  GE: "ka",
  AM: "hy",
  AZ: "az",
};

/**
 * Ordered language-code candidates for a visitor country.
 * 1) country lowercased (RU→ru, FI→fi)
 * 2) alias when country ≠ language (SE→sv)
 * Does not include the global `en` fallback — caller adds that.
 */
export function languageCandidatesForCountry(
  countryIso: string | null | undefined,
): string[] {
  const country = countryIso?.trim().toUpperCase() ?? "";
  if (!country || country.length !== 2) {
    return [];
  }

  const candidates: string[] = [];
  const exact = country.toLowerCase();
  candidates.push(exact);

  const alias = COUNTRY_LANGUAGE_ALIASES[country];
  if (alias && alias !== exact) {
    candidates.push(alias);
  }

  return candidates;
}

/** First candidate that exists in the active language set, or null. */
export function matchActiveLanguageForCountry(
  countryIso: string | null | undefined,
  activeCodes: Set<string>,
): string | null {
  for (const code of languageCandidatesForCountry(countryIso)) {
    if (activeCodes.has(code)) {
      return code;
    }
  }
  return null;
}
