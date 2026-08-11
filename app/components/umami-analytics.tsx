"use client";

import Script from "next/script";
import { useCookieConsent } from "@/app/components/cookie-consent-context";
import {
  getUmamiWebsiteId,
  UMAMI_SCRIPT_SRC,
} from "@/app/lib/analytics/umami";

/**
 * Loads Umami only after the visitor has accepted the analytics cookie category.
 * Placed in the root layout so every public and signed-in page is covered.
 */
export function UmamiAnalytics() {
  const { isReady, isAllowed } = useCookieConsent();
  const websiteId = getUmamiWebsiteId();

  if (!isReady || !websiteId || !isAllowed("analytics")) {
    return null;
  }

  return (
    <Script
      defer
      src={UMAMI_SCRIPT_SRC}
      data-website-id={websiteId}
      strategy="afterInteractive"
    />
  );
}
