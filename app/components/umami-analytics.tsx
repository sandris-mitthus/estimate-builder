"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { useCookieConsent } from "@/app/components/cookie-consent-context";
import {
  trackUmamiPageview,
  UMAMI_SCRIPT_SRC,
} from "@/app/lib/analytics/umami";

/**
 * Sends Umami pageviews only after analytics cookie consent.
 * The tracker script itself is in the root layout `<head>` so it appears in
 * the HTML source; auto-tracking stays off until this component records a view.
 */
export function UmamiAnalytics() {
  const { isReady, isAllowed } = useCookieConsent();
  const pathname = usePathname();
  const allowed = isReady && isAllowed("analytics");

  useEffect(() => {
    if (!allowed) {
      return;
    }

    if (trackUmamiPageview()) {
      return;
    }

    const script = document.querySelector<HTMLScriptElement>(
      `script[src="${UMAMI_SCRIPT_SRC}"]`,
    );
    if (!script) {
      return;
    }

    const onLoad = () => {
      trackUmamiPageview();
    };
    script.addEventListener("load", onLoad);
    return () => {
      script.removeEventListener("load", onLoad);
    };
  }, [allowed, pathname]);

  return null;
}
