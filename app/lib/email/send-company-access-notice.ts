import { Resend } from "resend";
import { getCompanyDisplayName } from "@/app/lib/settings/repository";
import {
  getSiteSettings,
  getSiteTranslationDictionary,
  getUserActiveLanguageCode,
} from "@/app/lib/site-admin/repository";
import { createAdminClient } from "@/app/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/app/lib/supabase/env";
import { translateText } from "@/app/lib/i18n/translations";
import { resolveResendConfig } from "@/app/lib/email/resend-config";
import { FALLBACK_TEMPLATES } from "@/app/lib/email/templates";

export type CompanyAccessNoticeKind = "disabled" | "restored" | "removed";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function textToEmailHtml(text: string): string {
  const paragraphs = text
    .trim()
    .split(/\n\n+/)
    .map((block) => {
      const lines = escapeHtml(block).replace(/\n/g, "<br />");
      return `<p style="margin:0 0 1em 0;font-family:system-ui,sans-serif;font-size:15px;line-height:1.5;color:#18181b;">${lines}</p>`;
    });
  return `<div>${paragraphs.join("")}</div>`;
}

/**
 * Sends an informational email about company access changes via Resend.
 * Skips when Resend is disabled or not configured. Never throws.
 */
export async function sendCompanyAccessNotice(
  userId: string,
  kind: CompanyAccessNoticeKind,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const config = await resolveResendConfig();
    if (!config) {
      console.warn(
        "[email] Skipping company access notice: Resend is disabled or not configured.",
      );
      return { ok: false, error: "E-pasta sūtīšana nav konfigurēta." };
    }

    if (!isSupabaseAdminConfigured()) {
      return { ok: false, error: "Datubāze nav konfigurēta." };
    }

    const supabase = createAdminClient();
    const { data: profile } = await supabase
      .from("users")
      .select("id, email, name")
      .eq("id", userId.trim())
      .maybeSingle();

    const email =
      typeof profile?.email === "string" ? profile.email.trim() : "";
    if (!email) {
      console.warn(
        `[email] Skipping company access notice (${kind}): user ${userId} has no email.`,
      );
      return { ok: false, error: "Lietotāja e-pasts nav atrasts." };
    }

    const name =
      (typeof profile?.name === "string" && profile.name.trim()) ||
      email.split("@")[0] ||
      email;

    const [company, settings, languageCode] = await Promise.all([
      getCompanyDisplayName(),
      getSiteSettings(),
      getUserActiveLanguageCode(userId),
    ]);

    const companyName = company.trim() || settings.systemName;
    const systemName = settings.systemName.trim() || "Estimate Builder";
    const lang = languageCode === "en" ? "en" : "lv";
    const dictionary = await getSiteTranslationDictionary(lang);
    const fallback = FALLBACK_TEMPLATES[kind];
    const params = {
      name,
      company: companyName,
      system: systemName,
    };

    const subject = translateText(
      dictionary,
      `email.access.${kind}.subject`,
      fallback.subject[lang],
      params,
    );
    const body = translateText(
      dictionary,
      `email.access.${kind}.body`,
      fallback.body[lang],
      params,
    );

    const resend = new Resend(config.apiKey);
    const { error } = await resend.emails.send({
      from: config.from,
      to: email,
      subject,
      text: body,
      html: textToEmailHtml(body),
    });

    if (error) {
      console.warn(
        `[email] Failed to send company access notice (${kind}) to ${email}:`,
        error.message,
      );
      return { ok: false, error: error.message };
    }

    return { ok: true };
  } catch (error) {
    console.warn(
      `[email] Unexpected error sending company access notice (${kind}):`,
      error,
    );
    return {
      ok: false,
      error: error instanceof Error ? error.message : "E-pasta sūtīšana neizdevās.",
    };
  }
}
