"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/app/lib/auth/get-current-user";
import {
  getCurrentCompanyId,
  hasPendingCompanyInvite,
} from "@/app/lib/companies/current-company";
import { registerCompanyForCurrentUser } from "@/app/lib/companies/register-company";
import type { CompanySettings } from "@/app/lib/settings/types";
import { isSystemAdminUser } from "@/app/lib/users/system-admin-repository";

export async function registerCompanyAction(settings: CompanySettings) {
  const user = await getCurrentUser();
  if (!user) {
    return { ok: false as const, error: "Nav autorizācijas." };
  }

  if (await isSystemAdminUser(user)) {
    return {
      ok: false as const,
      error: "Sistēmas administrators uzņēmumu šeit neveido.",
    };
  }

  if (await getCurrentCompanyId()) {
    return { ok: false as const, error: "Tu jau esi piesaistīts uzņēmumam." };
  }

  if (await hasPendingCompanyInvite()) {
    return {
      ok: false as const,
      error: "Tev jau ir gaidošs uzņēmuma uzaicinājums.",
    };
  }

  const result = await registerCompanyForCurrentUser(settings);

  if (result.ok) {
    revalidatePath("/", "layout");
    revalidatePath("/");
    revalidatePath("/settings");
  }

  return result;
}
