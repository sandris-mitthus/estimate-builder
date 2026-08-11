import { headers } from "next/headers";

function isPrivateOrLocalIp(ip: string): boolean {
  const trimmed = ip.trim().toLowerCase();
  if (
    trimmed === "127.0.0.1" ||
    trimmed === "::1" ||
    trimmed === "0.0.0.0" ||
    trimmed === "localhost"
  ) {
    return true;
  }

  if (trimmed.startsWith("192.168.") || trimmed.startsWith("10.")) {
    return true;
  }

  // IPv4 link-local and CGNAT
  if (trimmed.startsWith("169.254.") || trimmed.startsWith("100.64.")) {
    return true;
  }

  // 172.16.0.0 – 172.31.255.255
  const match172 = trimmed.match(/^172\.(\d+)\./);
  if (match172) {
    const second = Number(match172[1]);
    if (second >= 16 && second <= 31) {
      return true;
    }
  }

  // Basic IPv6 ULA / link-local
  if (
    trimmed.startsWith("fc") ||
    trimmed.startsWith("fd") ||
    trimmed.startsWith("fe80:")
  ) {
    return true;
  }

  return false;
}

function readClientIp(headerStore: Headers): string | null {
  // Prefer platform-provided client IP when present.
  const vercelIp = headerStore.get("x-vercel-forwarded-for")?.split(",")[0]?.trim();
  if (vercelIp) return vercelIp;

  const realIp = headerStore.get("x-real-ip")?.trim();
  if (realIp) return realIp;

  const forwarded = headerStore.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }

  return null;
}

const GEO_FETCH_TIMEOUT_MS = 1500;

/** ISO 3166-1 alpha-2 country code from Vercel / IP lookup, or null. */
export async function detectCountryIsoFromRequest(): Promise<string | null> {
  const headerStore = await headers();

  const vercelCountry = headerStore.get("x-vercel-ip-country")?.trim();
  if (vercelCountry) {
    return vercelCountry.toUpperCase();
  }

  const ip = readClientIp(headerStore);
  if (!ip || isPrivateOrLocalIp(ip)) {
    return null;
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
        return null;
      }

      const data = (await response.json()) as { country_code?: string };
      const code = data.country_code?.trim();
      return code ? code.toUpperCase() : null;
    } finally {
      clearTimeout(timer);
    }
  } catch {
    return null;
  }
}
