"use server";

import { revalidatePath } from "next/cache";
import { validateRequiredEmail } from "@/app/lib/validation/contact-fields";
import { inviteUser } from "@/app/lib/users/repository";

export async function inviteUserAction(email: string) {
  const emailError = validateRequiredEmail(email);
  if (emailError) {
    return { ok: false as const, error: emailError };
  }

  const result = await inviteUser(email);

  if (result.ok) {
    revalidatePath("/users");
  }

  return result;
}
