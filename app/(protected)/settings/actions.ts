"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/app/lib/auth/require-auth";
import {
  deleteCompanyLogoFromStorage,
  uploadCompanyLogo,
} from "@/app/lib/settings/logo-storage";
import {
  getCompanySettings,
  saveCompanySettings,
} from "@/app/lib/settings/repository";
import type { CompanySettings } from "@/app/lib/settings/types";

export async function saveCompanySettingsAction(settings: CompanySettings) {
  const { denied } = await requireAuth();
  if (denied) return denied;

  const result = await saveCompanySettings(settings);

  if (result.ok) {
    revalidatePath("/settings");
    revalidatePath("/", "layout");
  }

  return result;
}

export async function uploadCompanyLogoAction(formData: FormData) {
  const { denied } = await requireAuth();
  if (denied) return denied;

  const file = formData.get("logo");

  if (!(file instanceof File) || file.size === 0) {
    return { ok: false as const, error: "Izvēlies attēlu." };
  }

  const uploadResult = await uploadCompanyLogo(file);
  if (!uploadResult.ok) {
    return uploadResult;
  }

  const currentSettings = await getCompanySettings();
  const saveResult = await saveCompanySettings({
    ...currentSettings,
    logoUrl: uploadResult.logoUrl,
  });

  if (!saveResult.ok) {
    return saveResult;
  }

  revalidatePath("/settings");
  return uploadResult;
}

export async function removeCompanyLogoAction() {
  const { denied } = await requireAuth();
  if (denied) return denied;

  await deleteCompanyLogoFromStorage();

  const currentSettings = await getCompanySettings();
  const saveResult = await saveCompanySettings({
    ...currentSettings,
    logoUrl: "",
  });

  if (!saveResult.ok) {
    return saveResult;
  }

  revalidatePath("/settings");
  return { ok: true as const };
}
