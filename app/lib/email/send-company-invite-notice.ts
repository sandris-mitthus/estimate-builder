import { Resend } from "resend";
import { getCompanyDisplayName } from "@/app/lib/settings/repository";
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
  lv: "Apstiprināt uzaicinājumu",
  en: "Confirm invitation",
} as const;

const FOOTER_FALLBACK = {
  lv: "Ja poga nedarbojas, atver šo saiti pārlūkā:",
  en: "If the button does not work, open this link in your browser:",
} as const;

/**
 * Sends a company invitation email via Resend with HTML layout + confirm CTA.
 * Call only when resolveResendConfig() succeeded and a link was generated.
 */
export async function sendCompanyInviteNotice(options: {
  email: string;
  inviteLink: string;
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

    const link = options.inviteLink.trim();
    if (!link) {
      return { ok: false, error: "Uzaicinājuma saite nav atrasta." };
    }

    const [company, settings, defaultLang] = await Promise.all([
      getCompanyDisplayName(),
      getSiteSettings(),
      getDefaultSiteLanguageCode(),
    ]);

    const companyName = company.trim() || settings.systemName;
    const systemName = settings.systemName.trim() || "Estimate Builder";
    const langRaw = (options.languageCode || defaultLang || "lv").trim();
    const lang = langRaw === "en" ? "en" : "lv";
    const dictionary = await getSiteTranslationDictionary(lang);
    const fallback = FALLBACK_TEMPLATES.invite;
    const name = email.split("@")[0] || email;
    const params = {
      name,
      company: companyName,
      system: systemName,
      link,
    };

    const subject = translateText(
      dictionary,
      "email.invite.subject",
      fallback.subject[lang],
      params,
    );
    const body = translateText(
      dictionary,
      "email.invite.body",
      fallback.body[lang],
      params,
    );
    const buttonLabel = translateText(
      dictionary,
      "email.invite.button",
      BUTTON_FALLBACK[lang],
      params,
    );
    const footerHint = translateText(
      dictionary,
      "email.invite.footer_hint",
      FOOTER_FALLBACK[lang],
      params,
    );

    const html = buildInviteEmailHtml({
      systemName,
      companyName,
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
        `[email] Failed to send invite notice to ${email}:`,
        error.message,
      );
      return { ok: false, error: error.message };
    }

    return { ok: true };
  } catch (error) {
    console.warn("[email] Unexpected error sending invite notice:", error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : "E-pasta sūtīšana neizdevās.",
    };
  }
}
