import { createAdminClient } from "@/app/lib/supabase/admin";
import {
  isSupabaseAdminConfigured,
  getSupabasePublicEnv,
} from "@/app/lib/supabase/env";
import { validateRequiredEmail } from "@/app/lib/validation/contact-fields";
import { resolveResendConfig } from "@/app/lib/email/resend-config";
import { sendSignupConfirmation } from "@/app/lib/email/send-signup-confirmation";
import {
  authConfirmRedirectUrl,
  resolveAuthEmailLink,
} from "@/app/lib/auth/auth-confirm-link";
import { findAuthUserByEmailExact } from "@/app/lib/auth/find-auth-user-by-email";
import { checkAuthEmailRateLimit } from "@/app/lib/security/auth-rate-limit";

const MIN_PASSWORD_LENGTH = 8;

function isAlreadyRegisteredError(error: {
  message?: string;
  code?: string;
}): boolean {
  const code = error.code?.toLowerCase() ?? "";
  const message = error.message?.toLowerCase() ?? "";
  return (
    code === "email_exists" ||
    code === "user_already_exists" ||
    message.includes("already") ||
    message.includes("registered") ||
    message.includes("exists")
  );
}

function validatePassword(password: string): string | null {
  if (!password) {
    return "Ievadi paroli.";
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return "Parolei jābūt vismaz 8 rakstzīmēm.";
  }
  return null;
}

async function sendSignupLink(
  email: string,
  password: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const admin = createAdminClient();
  const redirectTo = authConfirmRedirectUrl();
  const generated = await admin.auth.admin.generateLink({
    type: "signup",
    email,
    password,
    options: { redirectTo },
  });

  let confirmLink = resolveAuthEmailLink(generated.data?.properties, {
    type: "signup",
  });

  if (generated.error || !confirmLink) {
    if (generated.error && isAlreadyRegisteredError(generated.error)) {
      const existing = await findAuthUserByEmailExact(email);
      if (existing?.emailConfirmed) {
        // Avoid account enumeration — same success as a fresh signup.
        return { ok: true };
      }

      if (existing && !existing.emailConfirmed) {
        // Do not set/overwrite password on unconfirmed accounts (pre-confirm takeover).
        const invite = await admin.auth.admin.generateLink({
          type: "invite",
          email,
          options: { redirectTo },
        });
        confirmLink = resolveAuthEmailLink(invite.data?.properties, {
          type: "invite",
        });
        if (invite.error || !confirmLink) {
          return {
            ok: false,
            error: "Neizdevās nosūtīt apstiprinājuma e-pastu.",
          };
        }
      } else {
        return {
          ok: false,
          error: "Neizdevās nosūtīt apstiprinājuma e-pastu.",
        };
      }
    } else {
      return {
        ok: false,
        error: "Neizdevās nosūtīt apstiprinājuma e-pastu.",
      };
    }
  }

  return sendSignupConfirmation({
    email,
    confirmLink,
  });
}

/**
 * Registers a user with email/password and sends Resend confirmation.
 * Available only when Resend integration is enabled.
 */
export async function registerWithEmailPassword(
  email: string,
  password: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const config = await resolveResendConfig();
  if (!config) {
    return {
      ok: false,
      error: "E-pasta reģistrācija pieejama tikai ar ieslēgtu Resend.",
    };
  }

  if (!isSupabaseAdminConfigured() || !getSupabasePublicEnv()) {
    return { ok: false, error: "Datubāze nav konfigurēta." };
  }

  const emailError = validateRequiredEmail(email);
  if (emailError) {
    return { ok: false, error: emailError };
  }

  const passwordError = validatePassword(password);
  if (passwordError) {
    return { ok: false, error: passwordError };
  }

  const trimmedEmail = email.trim().toLowerCase();
  const allowed = await checkAuthEmailRateLimit("signup", trimmedEmail);
  if (!allowed) {
    return {
      ok: false,
      error: "Pārāk daudz mēģinājumu. Mēģini vēlāk.",
    };
  }

  const existing = await findAuthUserByEmailExact(trimmedEmail);
  if (existing?.emailConfirmed) {
    // Silent success — do not reveal that the account already exists.
    return { ok: true };
  }

  return sendSignupLink(trimmedEmail, password);
}

/**
 * Re-sends the signup confirmation email (unconfirmed accounts only).
 * Always returns ok for missing/confirmed accounts to avoid enumeration.
 */
export async function resendSignupConfirmationEmail(
  email: string,
  password: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const config = await resolveResendConfig();
  if (!config) {
    return {
      ok: false,
      error: "E-pasta apstiprinājums pieejams tikai ar ieslēgtu Resend.",
    };
  }

  if (!isSupabaseAdminConfigured()) {
    return { ok: false, error: "Datubāze nav konfigurēta." };
  }

  const emailError = validateRequiredEmail(email);
  if (emailError) {
    return { ok: false, error: emailError };
  }

  const passwordError = validatePassword(password);
  if (passwordError) {
    return { ok: false, error: passwordError };
  }

  const trimmedEmail = email.trim().toLowerCase();
  const allowed = await checkAuthEmailRateLimit("resend_signup", trimmedEmail);
  if (!allowed) {
    return {
      ok: false,
      error: "Pārāk daudz mēģinājumu. Mēģini vēlāk.",
    };
  }

  const existing = await findAuthUserByEmailExact(trimmedEmail);
  if (!existing || existing.emailConfirmed) {
    return { ok: true };
  }

  return sendSignupLink(trimmedEmail, password);
}

export { MIN_PASSWORD_LENGTH };
