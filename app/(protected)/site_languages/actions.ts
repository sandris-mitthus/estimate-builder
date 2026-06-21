"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { assertSystemAdminAccess } from "@/app/lib/site-admin/access";
import { SITE_TRANSLATIONS_CACHE_TAG } from "@/app/lib/i18n/cache-tags";
import {
  createSiteLanguage,
  deleteSiteLanguage,
  setDefaultSiteLanguage,
  updateSiteLanguage,
  updateSiteLanguageActiveStatus,
  type SiteLanguageInput,
  type SiteLanguageUpdateInput,
} from "@/app/lib/site-admin/repository";

export async function createSiteLanguageAction(input: SiteLanguageInput) {
  await assertSystemAdminAccess();

  const result = await createSiteLanguage(input);

  if (result.ok) {
    revalidateTag(SITE_TRANSLATIONS_CACHE_TAG, "max");
    revalidatePath("/site_languages");
    revalidatePath("/", "layout");
  }

  return result;
}

export async function updateSiteLanguageActiveStatusAction(
  code: string,
  isActive: boolean,
) {
  await assertSystemAdminAccess();

  const result = await updateSiteLanguageActiveStatus(code, isActive);

  if (result.ok) {
    revalidateTag(SITE_TRANSLATIONS_CACHE_TAG, "max");
    revalidatePath("/site_languages");
    revalidatePath("/", "layout");
  }

  return result;
}

export async function updateSiteLanguageAction(
  currentCode: string,
  input: SiteLanguageUpdateInput,
) {
  await assertSystemAdminAccess();

  const result = await updateSiteLanguage(currentCode, input);

  if (result.ok) {
    revalidateTag(SITE_TRANSLATIONS_CACHE_TAG, "max");
    revalidatePath("/site_languages");
    revalidatePath("/site_translations");
    revalidatePath("/", "layout");
  }

  return result;
}

export async function deleteSiteLanguageAction(code: string) {
  await assertSystemAdminAccess();

  const result = await deleteSiteLanguage(code);

  if (result.ok) {
    revalidateTag(SITE_TRANSLATIONS_CACHE_TAG, "max");
    revalidatePath("/site_languages");
    revalidatePath("/site_translations");
    revalidatePath("/", "layout");
  }

  return result;
}

export async function setDefaultSiteLanguageAction(code: string) {
  await assertSystemAdminAccess();

  const result = await setDefaultSiteLanguage(code);

  if (result.ok) {
    revalidateTag(SITE_TRANSLATIONS_CACHE_TAG, "max");
    revalidatePath("/site_languages");
    revalidatePath("/", "layout");
  }

  return result;
}
