export function getGoogleMapsApiKey(): string | null {
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim();
  if (!key || key.includes("YOUR_")) return null;
  return key;
}

/** Referer sent on server-side Google requests when the API key uses HTTP referrer restrictions. */
export function getGoogleMapsReferer(): string {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (siteUrl) {
    return siteUrl.endsWith("/") ? siteUrl : `${siteUrl}/`;
  }

  const port = process.env.PORT?.trim() || "3100";
  return `http://localhost:${port}/`;
}

export function getGoogleMapsServerApiKey(): string | null {
  const serverKey = process.env.GOOGLE_MAPS_API_KEY?.trim();
  if (serverKey && !serverKey.includes("YOUR_")) {
    return serverKey;
  }

  return getGoogleMapsApiKey();
}

export function isGoogleMapsConfigured() {
  return getGoogleMapsServerApiKey() !== null;
}

export function isGoogleMapsEmbedConfigured() {
  return getGoogleMapsApiKey() !== null;
}
