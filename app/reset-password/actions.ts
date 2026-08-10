"use server";

import { MIN_PASSWORD_LENGTH } from "@/app/lib/auth/email-password";
import { createClient } from "@/app/lib/supabase/server";

function mapUpdatePasswordError(message: string): string {
  const lower = message.toLowerCase();
  if (
    lower.includes("same password") ||
    lower.includes("should be different") ||
    lower.includes("different from the old")
  ) {
    return "Jaunajai parolei jābūt atšķirīgai no iepriekšējās.";
  }
  if (
    lower.includes("weak") ||
    lower.includes("password is known") ||
    lower.includes("pwned") ||
    lower.includes("leaked")
  ) {
    return "Parole ir pārāk vāja. Izvēlies sarežģītāku paroli.";
  }
  if (
    lower.includes("session") ||
    lower.includes("not authenticated") ||
    lower.includes("jwt") ||
    lower.includes("auth session missing")
  ) {
    return "Atjaunošanas saite nav derīga vai ir beigusies. Pieprasi jaunu saiti.";
  }
  return "Neizdevās saglabāt jauno paroli.";
}

export async function updatePasswordAfterRecoveryAction(input: {
  password: string;
  confirmPassword: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const password = input.password ?? "";
  const confirmPassword = input.confirmPassword ?? "";

  if (!password) {
    return { ok: false, error: "Ievadi paroli." };
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return { ok: false, error: "Parolei jābūt vismaz 8 rakstzīmēm." };
  }
  if (password !== confirmPassword) {
    return { ok: false, error: "Paroles nesakrīt." };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      ok: false,
      error:
        "Atjaunošanas saite nav derīga vai ir beigusies. Pieprasi jaunu saiti.",
    };
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    console.warn("[auth] updateUser password failed:", error.message);
    return { ok: false, error: mapUpdatePasswordError(error.message) };
  }

  return { ok: true };
}
