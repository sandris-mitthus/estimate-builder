"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { assertSystemAdminAccess } from "@/app/lib/site-admin/access";
import {
  SITE_SETTINGS_CACHE_TAG,
  SITE_TRANSLATIONS_CACHE_TAG,
} from "@/app/lib/i18n/cache-tags";
import {
  saveResendSettings,
  type ResendSettingsInput,
} from "@/app/lib/email/resend-config";
import {
  saveEmailTemplateDrafts,
  type EmailTemplateDraft,
} from "@/app/lib/email/templates";

function revalidateEmailTemplates() {
  revalidateTag(SITE_SETTINGS_CACHE_TAG, "max");
  revalidateTag(SITE_TRANSLATIONS_CACHE_TAG, "max");
  revalidatePath("/site_email_templates");
}

export async function saveResendSettingsAction(input: ResendSettingsInput) {
  await assertSystemAdminAccess();
  const result = await saveResendSettings(input);
  if (result.ok) {
    revalidateEmailTemplates();
  }
  return result;
}

export async function saveEmailTemplatesAction(drafts: EmailTemplateDraft[]) {
  await assertSystemAdminAccess();
  const result = await saveEmailTemplateDrafts(drafts);
  if (result.ok) {
    revalidateEmailTemplates();
  }
  return result;
}
