import { Resend } from "resend";
import {
  getDefaultSiteLanguageCode,
  getSiteSettings,
  getSiteTranslationDictionary,
} from "@/app/lib/site-admin/repository";
import { translateText } from "@/app/lib/i18n/translations";
import { resolveResendConfig } from "@/app/lib/email/resend-config";
import { FALLBACK_TEMPLATES } from "@/app/lib/email/templates";
import { buildInviteEmailHtml } from "@/app/lib/email/build-invite-email-html";

const BUTTON_FALLBACK = {
  lv: "Apstiprināt e-pastu",
  en: "Confirm email",
} as const;

const FOOTER_FALLBACK = {
  lv: "Ja poga nedarbojas, atver šo saiti pārlūkā:",
  en: "If the button does not work, open this link in your browser:",
} as const;

/**
 * Sends HTML signup confirmation email via Resend.
 */
export async function sendSignupConfirmation(options: {
  email: string;
  confirmLink: string;
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

    const link = options.confirmLink.trim();
    if (!link) {
      return { ok: false, error: "Apstiprinājuma saite nav atrasta." };
    }

    const [settings, defaultLang] = await Promise.all([
      getSiteSettings(),
      getDefaultSiteLanguageCode(),
    ]);

    const systemName = settings.systemName.trim() || "Estimate Builder";
    const langRaw = (options.languageCode || defaultLang || "lv").trim();
    const lang = langRaw === "en" ? "en" : "lv";
    const dictionary = await getSiteTranslationDictionary(lang);
    const fallback = FALLBACK_TEMPLATES.signup;
    const name = email.split("@")[0] || email;
    const params = {
      name,
      company: systemName,
      system: systemName,
      link,
    };

    const subject = translateText(
      dictionary,
      "email.signup.subject",
      fallback.subject[lang],
      params,
    );
    const body = translateText(
      dictionary,
      "email.signup.body",
      fallback.body[lang],
      params,
    );
    const buttonLabel = translateText(
      dictionary,
      "email.signup.button",
      BUTTON_FALLBACK[lang],
      params,
    );
    const footerHint = translateText(
      dictionary,
      "email.signup.footer_hint",
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
        `[email] Failed to send signup confirmation to ${email}:`,
        error.message,
      );
      return { ok: false, error: error.message };
    }

    return { ok: true };
  } catch (error) {
    console.warn("[email] Unexpected error sending signup confirmation:", error);
    return {
      ok: false,
      error:
        error instanceof Error ? error.message : "E-pasta sūtīšana neizdevās.",
    };
  }
}
