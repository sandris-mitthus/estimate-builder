import { headers } from "next/headers";
import {
  callingCodeFromCountryIso,
  DEFAULT_CALLING_CODE,
  normalizeCallingCode,
} from "@/app/lib/geo/country-calling-codes";

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

export async function detectCallingCodeFromRequest(): Promise<string> {
  const headerStore = await headers();

  const vercelCountry = headerStore.get("x-vercel-ip-country");
  if (vercelCountry) {
    return callingCodeFromCountryIso(vercelCountry);
  }

  const ip = readClientIp(headerStore);
  if (!ip || isLocalIp(ip)) {
    return DEFAULT_CALLING_CODE;
  }

  try {
    const response = await fetch(`https://ipapi.co/${encodeURIComponent(ip)}/json/`, {
      next: { revalidate: 86_400 },
    });

    if (!response.ok) {
      return DEFAULT_CALLING_CODE;
    }

    const data = (await response.json()) as {
      country_calling_code?: string;
      country_code?: string;
    };

    if (data.country_calling_code) {
      return normalizeCallingCode(data.country_calling_code);
    }

    if (data.country_code) {
      return callingCodeFromCountryIso(data.country_code);
    }
  } catch {
    return DEFAULT_CALLING_CODE;
  }

  return DEFAULT_CALLING_CODE;
}
