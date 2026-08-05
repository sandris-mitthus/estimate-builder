"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { assertSystemAdminAccess } from "@/app/lib/site-admin/access";
import { SITE_SETTINGS_CACHE_TAG } from "@/app/lib/i18n/cache-tags";
import {
  deleteSiteBrandingAsset,
  uploadSiteBrandingAsset,
} from "@/app/lib/site-admin/branding-storage";
import type { SiteBrandingAssetKind } from "@/app/lib/site-admin/branding-validation";
import {
  saveSiteSettings,
  updateSiteBrandingUrl,
  type SiteSettingsInput,
} from "@/app/lib/site-admin/repository";

function revalidateSiteBranding() {
  revalidateTag(SITE_SETTINGS_CACHE_TAG, "max");
  revalidatePath("/site_settings");
  revalidatePath("/", "layout");
  revalidatePath("/login");
  revalidatePath("/privacy");
  revalidatePath("/terms");
  revalidatePath("/cookies");
}

export async function saveSiteSettingsAction(settings: SiteSettingsInput) {
  await assertSystemAdminAccess();

  const result = await saveSiteSettings(settings);

  if (result.ok) {
    revalidateSiteBranding();
  }

  return result;
}

export async function uploadSiteBrandingAction(
  kind: SiteBrandingAssetKind,
  formData: FormData,
) {
  await assertSystemAdminAccess();

  const file = formData.get(kind);
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false as const, error: "Izvēlies attēlu." };
  }

  const uploadResult = await uploadSiteBrandingAsset(kind, file);
  if (!uploadResult.ok) {
    return uploadResult;
  }

  const saveResult = await updateSiteBrandingUrl(kind, uploadResult.url);
  if (!saveResult.ok) {
    return saveResult;
  }

  revalidateSiteBranding();
  return { ok: true as const, url: uploadResult.url, settings: saveResult.settings };
}

export async function removeSiteBrandingAction(kind: SiteBrandingAssetKind) {
  await assertSystemAdminAccess();

  await deleteSiteBrandingAsset(kind);

  const saveResult = await updateSiteBrandingUrl(kind, "");
  if (!saveResult.ok) {
    return saveResult;
  }

  revalidateSiteBranding();
  return { ok: true as const, settings: saveResult.settings };
}
