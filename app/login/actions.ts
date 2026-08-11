"use server";

import {
  registerWithEmailPassword,
  resendSignupConfirmationEmail,
} from "@/app/lib/auth/email-password";
import { checkAuthEmailRateLimit } from "@/app/lib/security/auth-rate-limit";

export async function registerWithEmailAction(input: {
  email: string;
  password: string;
}) {
  return registerWithEmailPassword(input.email, input.password);
}

export async function resendSignupConfirmationAction(input: {
  email: string;
  password: string;
}) {
  return resendSignupConfirmationEmail(input.email, input.password);
}

/** Soft app-side gate before client Supabase password sign-in. */
export async function assertLoginRateLimitAction(input: { email: string }) {
  const allowed = await checkAuthEmailRateLimit("login", input.email);
  if (!allowed) {
    return {
      ok: false as const,
      error: "Pārāk daudz mēģinājumu. Mēģini vēlāk.",
    };
  }
  return { ok: true as const };
}
