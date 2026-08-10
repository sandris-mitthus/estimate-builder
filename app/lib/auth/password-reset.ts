import { createAdminClient } from "@/app/lib/supabase/admin";
import {
  isSupabaseAdminConfigured,
  getSupabasePublicEnv,
} from "@/app/lib/supabase/env";
import { validateRequiredEmail } from "@/app/lib/validation/contact-fields";
import { resolveResendConfig } from "@/app/lib/email/resend-config";
import { sendPasswordResetEmail } from "@/app/lib/email/send-password-reset";

function authRecoveryRedirectUrl(): string {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
    "http://localhost:3100";
  return `${base}/auth/confirm?next=/reset-password`;
}

async function findAuthUserByEmailExact(email: string): Promise<{
  id: string;
  emailConfirmed: boolean;
} | null> {
  const supabase = createAdminClient();
  const normalized = email.trim().toLowerCase();
  let page = 1;
  for (;;) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage: 200,
    });
    if (error) {
      return null;
    }
    const users = data.users ?? [];
    const match = users.find(
      (user) => (user.email ?? "").trim().toLowerCase() === normalized,
    );
    if (match) {
      return {
        id: match.id,
        emailConfirmed: Boolean(match.email_confirmed_at),
      };
    }
    if (users.length < 200) {
      return null;
    }
    page += 1;
  }
}

/**
 * Sends a password reset email via Resend when the account exists.
 * Always returns ok for unknown emails to avoid account enumeration.
 */
export async function requestPasswordReset(
  email: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const config = await resolveResendConfig();
  if (!config) {
    return {
      ok: false,
      error: "Paroles atjaunošana pieejama tikai ar ieslēgtu Resend.",
    };
  }

  if (!isSupabaseAdminConfigured() || !getSupabasePublicEnv()) {
    return { ok: false, error: "Datubāze nav konfigurēta." };
  }

  const emailError = validateRequiredEmail(email);
  if (emailError) {
    return { ok: false, error: emailError };
  }

  const trimmedEmail = email.trim().toLowerCase();
  const existing = await findAuthUserByEmailExact(trimmedEmail);

  // Silent success when the account is missing or not confirmed.
  if (!existing?.emailConfirmed) {
    return { ok: true };
  }

  const admin = createAdminClient();
  const generated = await admin.auth.admin.generateLink({
    type: "recovery",
    email: trimmedEmail,
    options: { redirectTo: authRecoveryRedirectUrl() },
  });

  const actionLink = generated.data?.properties?.action_link?.trim() ?? "";
  if (generated.error || !actionLink) {
    console.warn(
      "[auth] Failed to generate recovery link:",
      generated.error?.message,
    );
    return {
      ok: false,
      error: "Neizdevās nosūtīt paroles atjaunošanas e-pastu.",
    };
  }

  const sent = await sendPasswordResetEmail({
    email: trimmedEmail,
    resetLink: actionLink,
  });

  if (!sent.ok) {
    return {
      ok: false,
      error: "Neizdevās nosūtīt paroles atjaunošanas e-pastu.",
    };
  }

  return { ok: true };
}
