/** Umami Cloud – https://cloud.umami.is */

export const UMAMI_SCRIPT_SRC = "https://cloud.umami.is/script.js";

/** Default website ID; override with `NEXT_PUBLIC_UMAMI_WEBSITE_ID` if needed. */
export const UMAMI_WEBSITE_ID_DEFAULT =
  "0a7e73a3-a40f-40ad-9926-54d9ac425f52";

export type UmamiClient = {
  track: (
    event?: string | Record<string, unknown>,
    data?: Record<string, unknown>,
  ) => void;
};

declare global {
  interface Window {
    umami?: UmamiClient;
  }
}

export function getUmamiWebsiteId(): string | null {
  const fromEnv = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID?.trim();
  if (fromEnv) {
    return fromEnv;
  }
  return UMAMI_WEBSITE_ID_DEFAULT;
}

/** Sends a pageview. Returns false if the tracker is not loaded yet. */
export function trackUmamiPageview(): boolean {
  if (typeof window === "undefined" || typeof window.umami?.track !== "function") {
    return false;
  }

  window.umami.track();
  return true;
}
