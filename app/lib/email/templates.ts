import {
  listSiteLanguages,
  updateSiteTranslation,
  type SiteLanguageSummary,
} from "@/app/lib/site-admin/repository";
import { createAdminClient } from "@/app/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/app/lib/supabase/env";

export type EmailTemplateKind =
  | "invite"
  | "signup"
  | "disabled"
  | "restored"
  | "removed";

export type EmailTemplateDraft = {
  kind: EmailTemplateKind;
  subjectKey: string;
  bodyKey: string;
  buttonKey?: string;
  /** language code → subject text */
  subjects: Record<string, string>;
  /** language code → body text */
  bodies: Record<string, string>;
  /** language code → CTA button label (invite / signup) */
  buttons?: Record<string, string>;
};

export const EMAIL_TEMPLATE_KINDS: EmailTemplateKind[] = [
  "invite",
  "signup",
  "disabled",
  "restored",
  "removed",
];

const INVITE_BUTTON_KEY = "email.invite.button";
const SIGNUP_BUTTON_KEY = "email.signup.button";

const TEMPLATE_KEYS: Record<
  EmailTemplateKind,
  { subjectKey: string; bodyKey: string; buttonKey?: string }
> = {
  invite: {
    subjectKey: "email.invite.subject",
    bodyKey: "email.invite.body",
    buttonKey: INVITE_BUTTON_KEY,
  },
  signup: {
    subjectKey: "email.signup.subject",
    bodyKey: "email.signup.body",
    buttonKey: SIGNUP_BUTTON_KEY,
  },
  disabled: {
    subjectKey: "email.access.disabled.subject",
    bodyKey: "email.access.disabled.body",
  },
  restored: {
    subjectKey: "email.access.restored.subject",
    bodyKey: "email.access.restored.body",
  },
  removed: {
    subjectKey: "email.access.removed.subject",
    bodyKey: "email.access.removed.body",
  },
};

const BUTTON_FALLBACK: Record<"invite" | "signup", { lv: string; en: string }> =
  {
    invite: {
      lv: "Apstiprināt uzaicinājumu",
      en: "Confirm invitation",
    },
    signup: {
      lv: "Apstiprināt e-pastu",
      en: "Confirm email",
    },
  };

const FALLBACK_TEMPLATES: Record<
  EmailTemplateKind,
  { subject: { lv: string; en: string }; body: { lv: string; en: string } }
> = {
  invite: {
    subject: {
      lv: "Uzaicinājums uzņēmumam {company}",
      en: "Invitation to {company}",
    },
    body: {
      lv: "Sveiki, {name}!\n\nTu esi uzaicināts pievienoties uzņēmumam „{company}” sistēmā {system}.\n\nNospied pogu zemāk, lai apstiprinātu uzaicinājumu.",
      en: "Hello, {name}!\n\nYou have been invited to join “{company}” in {system}.\n\nPress the button below to confirm the invitation.",
    },
  },
  signup: {
    subject: {
      lv: "Apstiprini e-pastu — {system}",
      en: "Confirm your email — {system}",
    },
    body: {
      lv: "Sveiki, {name}!\n\nPaldies, ka reģistrējies sistēmā {system}.\n\nNospied pogu zemāk, lai apstiprinātu e-pastu un aktivizētu kontu.",
      en: "Hello, {name}!\n\nThanks for signing up to {system}.\n\nPress the button below to confirm your email and activate your account.",
    },
  },
  disabled: {
    subject: {
      lv: "Pieeja uzņēmumam {company} ir liegta",
      en: "Access to {company} has been disabled",
    },
    body: {
      lv: "Sveiki, {name}!\n\nTava pieeja uzņēmumam „{company}” sistēmā {system} ir liegta.\nJa tas ir kļūda, sazinies ar uzņēmuma administratoru.\n",
      en: "Hello, {name}!\n\nYour access to “{company}” in {system} has been disabled.\nIf this is a mistake, contact your company administrator.\n",
    },
  },
  restored: {
    subject: {
      lv: "Pieeja uzņēmumam {company} ir atjaunota",
      en: "Access to {company} has been restored",
    },
    body: {
      lv: "Sveiki, {name}!\n\nTava pieeja uzņēmumam „{company}” sistēmā {system} ir atjaunota. Vari atkal pierakstīties un turpināt darbu.\n",
      en: "Hello, {name}!\n\nYour access to “{company}” in {system} has been restored. You can sign in again and continue working.\n",
    },
  },
  removed: {
    subject: {
      lv: "Tu esi noņemts no uzņēmuma {company}",
      en: "You have been removed from {company}",
    },
    body: {
      lv: "Sveiki, {name}!\n\nTu esi noņemts no uzņēmuma „{company}” sistēmā {system}. Šim uzņēmumam vairs nav pieejas.\n",
      en: "Hello, {name}!\n\nYou have been removed from “{company}” in {system}. You no longer have access to this company.\n",
    },
  },
};

function parseValues(raw: unknown): Record<string, string> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return {};
  }
  const out: Record<string, string> = {};
  for (const [code, value] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof value === "string") {
      out[code] = value;
    }
  }
  return out;
}

function fallbackFor(
  kind: EmailTemplateKind,
  languageCode: string,
  part: "subject" | "body",
): string {
  const pack = FALLBACK_TEMPLATES[kind][part];
  if (languageCode === "en") return pack.en;
  return pack.lv;
}

function fallbackButton(
  kind: EmailTemplateKind,
  languageCode: string,
): string {
  if (kind !== "invite" && kind !== "signup") {
    return "";
  }
  const pack = BUTTON_FALLBACK[kind];
  return languageCode === "en" ? pack.en : pack.lv;
}

export async function listEmailTemplateDrafts(
  languages?: SiteLanguageSummary[],
): Promise<EmailTemplateDraft[]> {
  const langs =
    languages ?? (await listSiteLanguages({ activeOnly: true }));
  const languageCodes = langs.map((language) => language.code);
  if (languageCodes.length === 0) {
    languageCodes.push("lv", "en");
  }

  const allKeys = [
    ...EMAIL_TEMPLATE_KINDS.flatMap((kind) => {
      const keys = TEMPLATE_KEYS[kind];
      return keys.buttonKey
        ? [keys.subjectKey, keys.bodyKey, keys.buttonKey]
        : [keys.subjectKey, keys.bodyKey];
    }),
  ];

  const valuesByKey = new Map<string, Record<string, string>>();

  if (isSupabaseAdminConfigured()) {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("site_translations")
      .select("translation_key, values")
      .in("translation_key", allKeys);

    for (const row of data ?? []) {
      const key =
        typeof row.translation_key === "string" ? row.translation_key : "";
      if (!key) continue;
      valuesByKey.set(key, parseValues(row.values));
    }
  }

  return EMAIL_TEMPLATE_KINDS.map((kind) => {
    const { subjectKey, bodyKey, buttonKey } = TEMPLATE_KEYS[kind];
    const subjectValues = valuesByKey.get(subjectKey) ?? {};
    const bodyValues = valuesByKey.get(bodyKey) ?? {};
    const buttonValues = buttonKey
      ? (valuesByKey.get(buttonKey) ?? {})
      : {};
    const subjects: Record<string, string> = {};
    const bodies: Record<string, string> = {};
    const buttons: Record<string, string> = {};
    for (const code of languageCodes) {
      subjects[code] =
        subjectValues[code]?.trim() ||
        fallbackFor(kind, code, "subject");
      bodies[code] =
        bodyValues[code]?.trim() || fallbackFor(kind, code, "body");
      if (buttonKey) {
        buttons[code] =
          buttonValues[code]?.trim() || fallbackButton(kind, code);
      }
    }
    return {
      kind,
      subjectKey,
      bodyKey,
      buttonKey,
      subjects,
      bodies,
      ...(buttonKey ? { buttons } : {}),
    };
  });
}

export async function saveEmailTemplateDrafts(
  drafts: EmailTemplateDraft[],
): Promise<{ ok: true } | { ok: false; error: string }> {
  for (const draft of drafts) {
    const keys = TEMPLATE_KEYS[draft.kind];
    if (!keys) {
      return { ok: false, error: "Nezināms e-pasta šablons." };
    }

    const subjectResult = await updateSiteTranslation(keys.subjectKey, {
      key: keys.subjectKey,
      namespace: "email",
      description: `Email template subject (${draft.kind})`,
      values: draft.subjects,
    });
    if (!subjectResult.ok) {
      return subjectResult;
    }

    const bodyResult = await updateSiteTranslation(keys.bodyKey, {
      key: keys.bodyKey,
      namespace: "email",
      description: `Email template body (${draft.kind})`,
      values: draft.bodies,
    });
    if (!bodyResult.ok) {
      return bodyResult;
    }

    if (keys.buttonKey && draft.buttons) {
      const buttonResult = await updateSiteTranslation(keys.buttonKey, {
        key: keys.buttonKey,
        namespace: "email",
        description: `Email template button (${draft.kind})`,
        values: draft.buttons,
      });
      if (!buttonResult.ok) {
        return buttonResult;
      }
    }
  }

  return { ok: true };
}

export { TEMPLATE_KEYS, FALLBACK_TEMPLATES, BUTTON_FALLBACK };
