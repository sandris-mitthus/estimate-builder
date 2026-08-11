import { headers } from "next/headers";

const GEO_FETCH_TIMEOUT_MS = 1500;
const GEO_CACHE_TTL_MS = 10 * 60 * 1000;
const geoCache = new Map<string, { country: string | null; expiresAt: number }>();

const IPV4_RE =
  /^(?:(?:25[0-5]|2[0-4]\d|1?\d?\d)\.){3}(?:25[0-5]|2[0-4]\d|1?\d?\d)$/;
const IPV6_RE = /^[0-9a-f:]+$/i;

function isValidPublicIp(ip: string): boolean {
  const trimmed = ip.trim().toLowerCase();
  if (!trimmed || trimmed.includes("/") || trimmed.includes(" ")) {
    return false;
  }

  const isV4 = IPV4_RE.test(trimmed);
  const isV6 = trimmed.includes(":") && IPV6_RE.test(trimmed);
  if (!isV4 && !isV6) {
    return false;
  }

  if (
    trimmed === "127.0.0.1" ||
    trimmed === "::1" ||
    trimmed === "0.0.0.0" ||
    trimmed === "localhost"
  ) {
    return false;
  }

  if (trimmed.startsWith("192.168.") || trimmed.startsWith("10.")) {
    return false;
  }

  // IPv4 link-local and CGNAT
  if (trimmed.startsWith("169.254.") || trimmed.startsWith("100.64.")) {
    return false;
  }

  // 172.16.0.0 – 172.31.255.255
  const match172 = trimmed.match(/^172\.(\d+)\./);
  if (match172) {
    const second = Number(match172[1]);
    if (second >= 16 && second <= 31) {
      return false;
    }
  }

  // IPv6 ULA / link-local / localhost
  if (
    trimmed.startsWith("fc") ||
    trimmed.startsWith("fd") ||
    trimmed.startsWith("fe80:") ||
    trimmed === "::" ||
    trimmed.startsWith("::ffff:127.")
  ) {
    return false;
  }

  return true;
}

function readClientIp(headerStore: Headers): string | null {
  // Prefer platform-provided client IP when present (harder to spoof than XFF).
  const vercelIp = headerStore.get("x-vercel-forwarded-for")?.split(",")[0]?.trim();
  if (vercelIp && isValidPublicIp(vercelIp)) return vercelIp;

  const realIp = headerStore.get("x-real-ip")?.trim();
  if (realIp && isValidPublicIp(realIp)) return realIp;

  // Only trust X-Forwarded-For outside production (local / non-Vercel).
  if (process.env.NODE_ENV !== "production") {
    const forwarded = headerStore.get("x-forwarded-for");
    if (forwarded) {
      const first = forwarded.split(",")[0]?.trim();
      if (first && isValidPublicIp(first)) return first;
    }
  }

  return null;
}

async function lookupCountryFromIpapi(ip: string): Promise<string | null> {
  const cached = geoCache.get(ip);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.country;
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), GEO_FETCH_TIMEOUT_MS);
    try {
      const response = await fetch(
        `https://ipapi.co/${encodeURIComponent(ip)}/json/`,
        {
          next: { revalidate: 86_400 },
          signal: controller.signal,
        },
      );

      if (!response.ok) {
        geoCache.set(ip, { country: null, expiresAt: Date.now() + GEO_CACHE_TTL_MS });
        return null;
      }

      const data = (await response.json()) as { country_code?: string };
      const code = data.country_code?.trim();
      const country = code ? code.toUpperCase() : null;
      geoCache.set(ip, {
        country,
        expiresAt: Date.now() + GEO_CACHE_TTL_MS,
      });
      return country;
    } finally {
      clearTimeout(timer);
    }
  } catch {
    geoCache.set(ip, { country: null, expiresAt: Date.now() + GEO_CACHE_TTL_MS });
    return null;
  }
}

/** ISO 3166-1 alpha-2 country code from Vercel / IP lookup, or null. */
export async function detectCountryIsoFromRequest(): Promise<string | null> {
  const headerStore = await headers();

  const vercelCountry = headerStore.get("x-vercel-ip-country")?.trim();
  if (vercelCountry) {
    return vercelCountry.toUpperCase();
  }

  // Production on Vercel: prefer header only — skip spoofable IP → ipapi path.
  if (
    process.env.NODE_ENV === "production" &&
    (process.env.VERCEL === "1" || Boolean(process.env.VERCEL_ENV))
  ) {
    return null;
  }

  const ip = readClientIp(headerStore);
  if (!ip) {
    return null;
  }

  return lookupCountryFromIpapi(ip);
}
