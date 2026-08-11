import { headers } from "next/headers";

function isLocalIp(ip: string) {
  return (
    ip === "127.0.0.1" ||
    ip === "::1" ||
    ip.startsWith("192.168.") ||
    ip.startsWith("10.")
  );
}

function readClientIp(headerStore: Headers): string | null {
  const forwarded = headerStore.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }

  return headerStore.get("x-real-ip")?.trim() ?? null;
}

/** ISO 3166-1 alpha-2 country code from Vercel / IP lookup, or null. */
export async function detectCountryIsoFromRequest(): Promise<string | null> {
  const headerStore = await headers();

  const vercelCountry = headerStore.get("x-vercel-ip-country")?.trim();
  if (vercelCountry) {
    return vercelCountry.toUpperCase();
  }

  const ip = readClientIp(headerStore);
  if (!ip || isLocalIp(ip)) {
    return null;
  }

  try {
    const response = await fetch(
      `https://ipapi.co/${encodeURIComponent(ip)}/json/`,
      { next: { revalidate: 86_400 } },
    );

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as { country_code?: string };
    const code = data.country_code?.trim();
    return code ? code.toUpperCase() : null;
  } catch {
    return null;
  }
}
