"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { assertSystemAdminAccess } from "@/app/lib/site-admin/access";
import { SITE_SETTINGS_CACHE_TAG } from "@/app/lib/i18n/cache-tags";
import {
  saveSiteSettings,
  type SiteSettingsInput,
} from "@/app/lib/site-admin/repository";

export async function saveSiteSettingsAction(settings: SiteSettingsInput) {
  await assertSystemAdminAccess();

  const result = await saveSiteSettings(settings);

  if (result.ok) {
    revalidateTag(SITE_SETTINGS_CACHE_TAG, "max");
    revalidatePath("/site_settings");
    revalidatePath("/", "layout");
  }

  return result;
}
