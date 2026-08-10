import { Resend } from "resend";
import {
  getDefaultSiteLanguageCode,
  getSiteSettings,
  getSiteTranslationDictionary,
} from "@/app/lib/site-admin/repository";
import { translateText } from "@/app/lib/i18n/translations";
import { resolveResendConfig } from "@/app/lib/email/resend-config";
import { FALLBACK_TEMPLATES, BUTTON_FALLBACK } from "@/app/lib/email/templates";
import { buildInviteEmailHtml } from "@/app/lib/email/build-invite-email-html";

const FOOTER_FALLBACK = {
  lv: "Ja poga nedarbojas, atver šo saiti pārlūkā:",
  en: "If the button does not work, open this link in your browser:",
} as const;

/**
 * Sends HTML password reset email via Resend.
 */
export async function sendPasswordResetEmail(options: {
  email: string;
  resetLink: string;
  languageCode?: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const config = await resolveResendConfig();
    if (!config) {
      return { ok: false, error: "E-pasta sūtīšana nav konfigurēta." };
    }

    const email = options.email.trim().toLowerCase();
    if (!email) {
      return { ok: false, error: "E-pasts nav norādīts." };
    }

    const link = options.resetLink.trim();
    if (!link) {
      return { ok: false, error: "Atjaunošanas saite nav atrasta." };
    }

    const [settings, defaultLang] = await Promise.all([
      getSiteSettings(),
      getDefaultSiteLanguageCode(),
    ]);

    const systemName = settings.systemName.trim() || "Estimate Builder";
    const langRaw = (options.languageCode || defaultLang || "lv").trim();
    const lang = langRaw === "en" ? "en" : "lv";
    const dictionary = await getSiteTranslationDictionary(lang);
    const fallback = FALLBACK_TEMPLATES.password_reset;
    const name = email.split("@")[0] || email;
    const params = {
      name,
      company: systemName,
      system: systemName,
      link,
    };

    const subject = translateText(
      dictionary,
      "email.password_reset.subject",
      fallback.subject[lang],
      params,
    );
    const body = translateText(
      dictionary,
      "email.password_reset.body",
      fallback.body[lang],
      params,
    );
    const buttonLabel = translateText(
      dictionary,
      "email.password_reset.button",
      BUTTON_FALLBACK.password_reset[lang],
      params,
    );
    const footerHint = translateText(
      dictionary,
      "email.password_reset.footer_hint",
      FOOTER_FALLBACK[lang],
      params,
    );

    const html = buildInviteEmailHtml({
      systemName,
      companyName: systemName,
      bodyText: body,
      buttonLabel,
      inviteLink: link,
      footerHint,
    });

    const text = `${body}\n\n${buttonLabel}:\n${link}\n`;

    const resend = new Resend(config.apiKey);
    const { error } = await resend.emails.send({
      from: config.from,
      to: email,
      subject,
      text,
      html,
    });

    if (error) {
      console.warn(
        `[email] Failed to send password reset to ${email}:`,
        error.message,
      );
      return { ok: false, error: error.message };
    }

    return { ok: true };
  } catch (error) {
    console.warn("[email] Unexpected error sending password reset:", error);
    return {
      ok: false,
      error:
        error instanceof Error ? error.message : "E-pasta sūtīšana neizdevās.",
    };
  }
}
