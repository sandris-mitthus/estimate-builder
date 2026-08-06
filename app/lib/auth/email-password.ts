import { createAdminClient } from "@/app/lib/supabase/admin";
import {
  isSupabaseAdminConfigured,
  getSupabasePublicEnv,
} from "@/app/lib/supabase/env";
import { validateRequiredEmail } from "@/app/lib/validation/contact-fields";
import { resolveResendConfig } from "@/app/lib/email/resend-config";
import { sendSignupConfirmation } from "@/app/lib/email/send-signup-confirmation";

const MIN_PASSWORD_LENGTH = 8;

function authConfirmRedirectUrl(): string {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
    "http://localhost:3100";
  return `${base}/auth/confirm`;
}

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

  let actionLink = generated.data?.properties?.action_link?.trim() ?? "";

  if (generated.error || !actionLink) {
    if (generated.error && isAlreadyRegisteredError(generated.error)) {
      const existing = await findAuthUserByEmailExact(email);
      if (existing?.emailConfirmed) {
        return {
          ok: false,
          error: "Šis e-pasts jau ir reģistrēts. Pieraksties ar paroli.",
        };
      }

      if (existing && !existing.emailConfirmed) {
        await admin.auth.admin.updateUserById(existing.id, { password });
        const invite = await admin.auth.admin.generateLink({
          type: "invite",
          email,
          options: { redirectTo },
        });
        actionLink = invite.data?.properties?.action_link?.trim() ?? "";
        if (invite.error || !actionLink) {
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
    confirmLink: actionLink,
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
  const existing = await findAuthUserByEmailExact(trimmedEmail);
  if (existing?.emailConfirmed) {
    return {
      ok: false,
      error: "Šis e-pasts jau ir reģistrēts. Pieraksties ar paroli.",
    };
  }

  if (existing && !existing.emailConfirmed) {
    // Re-send confirmation for an unfinished registration.
    return sendSignupLink(trimmedEmail, password);
  }

  return sendSignupLink(trimmedEmail, password);
}

/**
 * Re-sends the signup confirmation email (unconfirmed accounts only).
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
  const existing = await findAuthUserByEmailExact(trimmedEmail);
  if (!existing) {
    return { ok: false, error: "Konts ar šo e-pastu nav atrasts." };
  }
  if (existing.emailConfirmed) {
    return {
      ok: false,
      error: "E-pasts jau ir apstiprināts. Vari pierakstīties.",
    };
  }

  return sendSignupLink(trimmedEmail, password);
}

export { MIN_PASSWORD_LENGTH };
