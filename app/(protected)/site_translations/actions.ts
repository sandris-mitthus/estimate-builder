"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { assertSystemAdminAccess } from "@/app/lib/site-admin/access";
import { SITE_TRANSLATIONS_CACHE_TAG } from "@/app/lib/i18n/cache-tags";
import {
  createSiteTranslation,
  deleteSiteTranslation,
  updateSiteTranslation,
  type SiteTranslationInput,
} from "@/app/lib/site-admin/repository";

export async function createSiteTranslationAction(input: SiteTranslationInput) {
  await assertSystemAdminAccess();

  const result = await createSiteTranslation(input);

  if (result.ok) {
    revalidateTag(SITE_TRANSLATIONS_CACHE_TAG, "max");
    revalidatePath("/site_translations");
    revalidatePath("/", "layout");
  }

  return result;
}

export async function updateSiteTranslationAction(
  currentKey: string,
  input: SiteTranslationInput,
) {
  await assertSystemAdminAccess();

  const result = await updateSiteTranslation(currentKey, input);

  if (result.ok) {
    revalidateTag(SITE_TRANSLATIONS_CACHE_TAG, "max");
    revalidatePath("/site_translations");
    revalidatePath("/", "layout");
  }

  return result;
}

export async function deleteSiteTranslationAction(key: string) {
  await assertSystemAdminAccess();

  const result = await deleteSiteTranslation(key);

  if (result.ok) {
    revalidateTag(SITE_TRANSLATIONS_CACHE_TAG, "max");
    revalidatePath("/site_translations");
    revalidatePath("/", "layout");
  }

  return result;
}
