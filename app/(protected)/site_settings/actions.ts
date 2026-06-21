"use server";

import { revalidatePath } from "next/cache";
import { assertSystemAdminAccess } from "@/app/lib/site-admin/access";
import {
  saveSiteSettings,
  type SiteSettingsInput,
} from "@/app/lib/site-admin/repository";

export async function saveSiteSettingsAction(settings: SiteSettingsInput) {
  await assertSystemAdminAccess();

  const result = await saveSiteSettings(settings);

  if (result.ok) {
    revalidatePath("/site_settings");
    revalidatePath("/", "layout");
  }

  return result;
}
