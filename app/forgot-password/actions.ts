"use server";

import { requestPasswordReset } from "@/app/lib/auth/password-reset";

export async function requestPasswordResetAction(input: { email: string }) {
  return requestPasswordReset(input.email);
}
