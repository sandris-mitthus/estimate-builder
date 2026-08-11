import { headers } from "next/headers";
import { checkRateLimit } from "@/app/lib/security/rate-limit";

async function clientIpKey(): Promise<string> {
  const headerStore = await headers();
  const forwarded = headerStore.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return headerStore.get("x-real-ip")?.trim() || "unknown";
}

/** Auth email flows: limit by IP + normalized email. */
export async function checkAuthEmailRateLimit(
  action: "signup" | "password_reset" | "resend_signup" | "login",
  email: string,
): Promise<boolean> {
  const ip = await clientIpKey();
  const normalizedEmail = email.trim().toLowerCase();
  const windowMs = 60 * 60 * 1000;
  const maxPerEmail = action === "login" ? 20 : 5;
  const maxPerIp = action === "login" ? 60 : 20;

  const emailOk = await checkRateLimit(
    `auth:${action}:email:${normalizedEmail}`,
    maxPerEmail,
    windowMs,
  );
  if (!emailOk) return false;

  return checkRateLimit(`auth:${action}:ip:${ip}`, maxPerIp, windowMs);
}
