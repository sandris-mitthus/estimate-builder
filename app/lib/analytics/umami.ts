/** Umami Cloud – https://cloud.umami.is */

export const UMAMI_SCRIPT_SRC = "https://cloud.umami.is/script.js";

/** Default website ID; override with `NEXT_PUBLIC_UMAMI_WEBSITE_ID` if needed. */
export const UMAMI_WEBSITE_ID_DEFAULT =
  "0a7e73a3-a40f-40ad-9926-54d9ac425f52";

export function getUmamiWebsiteId(): string | null {
  const fromEnv = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID?.trim();
  if (fromEnv) {
    return fromEnv;
  }
  return UMAMI_WEBSITE_ID_DEFAULT;
}
