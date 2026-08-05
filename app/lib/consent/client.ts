import {
  deleteCookie,
  listCookieNames,
  readCookie,
  writeCookie,
} from "@/app/lib/client/cookies";
import {
  COOKIE_CONSENT_COOKIE,
  COOKIE_CONSENT_MAX_AGE_DAYS,
  isCookieCategoryAllowed,
  isPreferenceCookieName,
  parseCookieConsent,
  serializeCookieConsent,
  type CookieConsentCategory,
  type CookieConsentState,
} from "@/app/lib/consent/cookie-consent";

export function readCookieConsentState(): CookieConsentState | null {
  return parseCookieConsent(readCookie(COOKIE_CONSENT_COOKIE));
}

export function writeCookieConsentState(state: CookieConsentState): void {
  writeCookie(
    COOKIE_CONSENT_COOKIE,
    serializeCookieConsent(state),
    COOKIE_CONSENT_MAX_AGE_DAYS,
  );
}

export function isCookieCategoryAllowedNow(
  category: CookieConsentCategory,
): boolean {
  return isCookieCategoryAllowed(readCookieConsentState(), category);
}

/**
 * Ērtības sīkdatņu rakstīšana. Bez `preferences` piekrišanas izmaiņa paliek
 * tikai lapas atvēršanas laikā — nekas netiek saglabāts ierīcē.
 */
export function writePreferenceCookie(
  name: string,
  value: string,
  maxAgeDays?: number,
): void {
  if (!isCookieCategoryAllowedNow("preferences")) {
    deleteCookie(name);
    return;
  }

  writeCookie(name, value, maxAgeDays);
}

/** Izsauc pēc piekrišanas atsaukšanas, lai jau saglabātās ērtības sīkdatnes pazūd. */
export function purgePreferenceCookies(): void {
  for (const name of listCookieNames()) {
    if (isPreferenceCookieName(name)) {
      deleteCookie(name);
    }
  }
}
