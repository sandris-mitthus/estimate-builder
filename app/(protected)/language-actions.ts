"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/app/lib/auth/get-current-user";
import { mapUserDisplay } from "@/app/lib/auth/map-user-display";
import { updateUserActiveLanguageCode } from "@/app/lib/site-admin/repository";

export async function updateActiveLanguageAction(code: string) {
  const user = await getCurrentUser();
  if (!user) {
    return { ok: false as const, error: "Nav autorizācijas." };
  }

  const display = mapUserDisplay(user);
  const result = await updateUserActiveLanguageCode({
    userId: user.id,
    email: user.email ?? "",
    name: display.name,
    avatarUrl: display.avatarUrl ?? "",
    code,
  });

  if (result.ok) {
    revalidatePath("/", "layout");
  }

  return result;
}
