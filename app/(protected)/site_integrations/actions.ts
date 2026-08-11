"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import {
  saveResendSettings,
  type ResendSettingsInput,
} from "@/app/lib/email/resend-config";
import { SITE_SETTINGS_CACHE_TAG } from "@/app/lib/i18n/cache-tags";
import {
  saveGoogleAuthSettings,
  type GoogleAuthSettingsInput,
} from "@/app/lib/integrations/google-auth";
import { setLandingPageEnabled } from "@/app/lib/integrations/landing-page";
import { assertSystemAdminAccess } from "@/app/lib/site-admin/access";

// Integrations change what anonymous visitors see and how emails are sent, so
// the public entry points have to be revalidated together with this page.
function revalidateIntegrations() {
  revalidateTag(SITE_SETTINGS_CACHE_TAG, "max");
  revalidatePath("/site_integrations");
  revalidatePath("/site_email_templates");
  revalidatePath("/", "layout");
  revalidatePath("/login");
  revalidatePath("/signup");
}

export async function setLandingPageEnabledAction(enabled: boolean) {
  await assertSystemAdminAccess();
  const result = await setLandingPageEnabled(enabled);
  if (result.ok) {
    revalidateIntegrations();
  }
  return result;
}

export async function saveResendSettingsAction(input: ResendSettingsInput) {
  await assertSystemAdminAccess();
  const result = await saveResendSettings(input);
  if (result.ok) {
    revalidateIntegrations();
  }
  return result;
}

export async function saveGoogleAuthSettingsAction(
  input: GoogleAuthSettingsInput,
) {
  await assertSystemAdminAccess();
  const result = await saveGoogleAuthSettings(input);
  if (result.ok) {
    revalidateIntegrations();
  }
  return result;
}
