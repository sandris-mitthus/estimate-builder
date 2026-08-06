"use client";

import { useMemo, useState, useTransition } from "react";
import {
  saveEmailTemplatesAction,
  saveResendSettingsAction,
} from "@/app/(protected)/site_email_templates/actions";
import { useFeedbackToast } from "@/app/components/feedback-toast-provider";
import { UnsavedChangesConfirmModal } from "@/app/components/unsaved-changes-confirm-modal";
import { useTranslations } from "@/app/components/translations-provider";
import { useUnsavedChangesGuard } from "@/app/lib/hooks/use-unsaved-changes-guard";
import { translateActionError } from "@/app/lib/i18n/action-errors";
import { interpolateTranslation } from "@/app/lib/i18n/translations";
import { buildInviteEmailHtml } from "@/app/lib/email/build-invite-email-html";
import type { ResendSettingsPublic } from "@/app/lib/email/resend-config";
import type {
  EmailTemplateDraft,
  EmailTemplateKind,
} from "@/app/lib/email/templates";
import type { SiteLanguageSummary } from "@/app/lib/site-admin/repository";

const fieldClassName =
  "mt-2 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100";
const labelClassName = "text-sm font-medium text-zinc-800";

const TEMPLATE_LABEL_KEYS: Record<
  EmailTemplateKind,
  { key: string; fallback: string }
> = {
  invite: {
    key: "site_email_templates.template.invite",
    fallback: "Uzaicinājums",
  },
  signup: {
    key: "site_email_templates.template.signup",
    fallback: "Reģistrācijas apstiprinājums",
  },
  disabled: {
    key: "site_email_templates.template.disabled",
    fallback: "Pieeja liegta",
  },
  restored: {
    key: "site_email_templates.template.restored",
    fallback: "Pieeja atjaunota",
  },
  removed: {
    key: "site_email_templates.template.removed",
    fallback: "Pieeja noņemta",
  },
};

const PREVIEW_PARAMS = {
  name: "Jānis Bērziņš",
  company: "Demo SIA",
  system: "Estimate Builder",
  link: "https://example.com/auth/confirm#…",
};

function Switch({
  checked,
  disabled,
  label,
  onChange,
}: {
  checked: boolean;
  disabled?: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition disabled:cursor-not-allowed disabled:opacity-60 ${
        checked ? "bg-zinc-900" : "bg-zinc-200"
      }`}
    >
      <span
        className={`inline-block size-5 rounded-full bg-white shadow-sm transition ${
          checked ? "translate-x-5" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

function cloneTemplates(templates: EmailTemplateDraft[]): EmailTemplateDraft[] {
  return templates.map((template) => ({
    ...template,
    subjects: { ...template.subjects },
    bodies: { ...template.bodies },
    ...(template.buttons
      ? { buttons: { ...template.buttons } }
      : {}),
  }));
}

function templatesEqual(
  left: EmailTemplateDraft[],
  right: EmailTemplateDraft[],
): boolean {
  if (left.length !== right.length) return false;
  return left.every((item, index) => {
    const other = right[index];
    if (!other || item.kind !== other.kind) return false;
    const subjectKeys = new Set([
      ...Object.keys(item.subjects),
      ...Object.keys(other.subjects),
    ]);
    for (const code of subjectKeys) {
      if ((item.subjects[code] ?? "") !== (other.subjects[code] ?? "")) {
        return false;
      }
    }
    const bodyKeys = new Set([
      ...Object.keys(item.bodies),
      ...Object.keys(other.bodies),
    ]);
    for (const code of bodyKeys) {
      if ((item.bodies[code] ?? "") !== (other.bodies[code] ?? "")) {
        return false;
      }
    }
    const leftButtons = item.buttons ?? {};
    const rightButtons = other.buttons ?? {};
    const buttonKeys = new Set([
      ...Object.keys(leftButtons),
      ...Object.keys(rightButtons),
    ]);
    for (const code of buttonKeys) {
      if ((leftButtons[code] ?? "") !== (rightButtons[code] ?? "")) {
        return false;
      }
    }
    return true;
  });
}

export function SiteEmailTemplatesForm({
  initialResend,
  initialTemplates,
  languages,
}: {
  initialResend: ResendSettingsPublic;
  initialTemplates: EmailTemplateDraft[];
  languages: SiteLanguageSummary[];
}) {
  const { t } = useTranslations();
  const { showFeedback, clearFeedback } = useFeedbackToast();
  const [isPending, startTransition] = useTransition();

  const [enabled, setEnabled] = useState(initialResend.enabled);
  const [emailFrom, setEmailFrom] = useState(initialResend.emailFrom);
  const [apiKey, setApiKey] = useState("");
  const [savedResend, setSavedResend] = useState(initialResend);

  const [templates, setTemplates] = useState(() =>
    cloneTemplates(initialTemplates),
  );
  const [savedTemplates, setSavedTemplates] = useState(() =>
    cloneTemplates(initialTemplates),
  );
  const [activeKind, setActiveKind] = useState<EmailTemplateKind>("invite");
  const [editLang, setEditLang] = useState(
    languages.find((language) => language.isDefault)?.code ??
      languages[0]?.code ??
      "lv",
  );

  const resendDirty =
    enabled !== savedResend.enabled ||
    emailFrom.trim() !== savedResend.emailFrom.trim() ||
    apiKey.trim().length > 0;
  const templatesDirty = !templatesEqual(templates, savedTemplates);
  const isDirty = resendDirty || templatesDirty;

  const { confirmOpen, stayOnPage, confirmLeave } = useUnsavedChangesGuard({
    isDirty,
  });

  const activeTemplate = useMemo(
    () => templates.find((template) => template.kind === activeKind) ?? null,
    [templates, activeKind],
  );
  const activeLanguage =
    languages.find((language) => language.code === editLang) ??
    languages[0] ??
    null;

  const previewSubject = activeTemplate
    ? interpolateTranslation(
        activeTemplate.subjects[editLang] ??
          activeTemplate.subjects.lv ??
          "",
        PREVIEW_PARAMS,
      )
    : "";
  const previewBody = activeTemplate
    ? interpolateTranslation(
        activeTemplate.bodies[editLang] ?? activeTemplate.bodies.lv ?? "",
        PREVIEW_PARAMS,
      )
    : "";
  const previewButton =
    activeTemplate?.kind === "invite" || activeTemplate?.kind === "signup"
      ? interpolateTranslation(
          activeTemplate.buttons?.[editLang] ??
            activeTemplate.buttons?.lv ??
            (activeTemplate.kind === "signup"
              ? "Apstiprināt e-pastu"
              : "Apstiprināt uzaicinājumu"),
          PREVIEW_PARAMS,
        )
      : "";
  const invitePreviewHtml =
    activeTemplate?.kind === "invite" || activeTemplate?.kind === "signup"
      ? buildInviteEmailHtml({
          systemName: PREVIEW_PARAMS.system,
          companyName: PREVIEW_PARAMS.company,
          bodyText: previewBody,
          buttonLabel: previewButton,
          inviteLink: PREVIEW_PARAMS.link,
          footerHint:
            editLang === "en"
              ? "If the button does not work, open this link in your browser:"
              : "Ja poga nedarbojas, atver šo saiti pārlūkā:",
        })
      : "";

  function updateTemplateField(
    kind: EmailTemplateKind,
    languageCode: string,
    part: "subjects" | "bodies" | "buttons",
    value: string,
  ) {
    clearFeedback();
    setTemplates((current) =>
      current.map((template) => {
        if (template.kind !== kind) return template;
        if (part === "buttons") {
          return {
            ...template,
            buttons: { ...(template.buttons ?? {}), [languageCode]: value },
          };
        }
        return {
          ...template,
          [part]: { ...template[part], [languageCode]: value },
        };
      }),
    );
  }

  function handleSaveResend(event: React.FormEvent) {
    event.preventDefault();
    clearFeedback();
    if (!resendDirty) return;

    if (enabled && !emailFrom.trim()) {
      showFeedback({
        type: "error",
        text: t(
          "site_email_templates.resend.validation.from_required",
          "Ievadi sūtītāja adresi, lai ieslēgtu Resend.",
        ),
      });
      return;
    }

    if (
      enabled &&
      !apiKey.trim() &&
      !savedResend.hasStoredApiKey &&
      !savedResend.hasEnvApiKey
    ) {
      showFeedback({
        type: "error",
        text: t(
          "site_email_templates.resend.validation.key_required",
          "Ievadi Resend API atslēgu vai iestati RESEND_API_KEY vidē.",
        ),
      });
      return;
    }

    startTransition(async () => {
      const result = await saveResendSettingsAction({
        enabled,
        emailFrom,
        apiKey,
      });
      if (result.ok) {
        setSavedResend(result.settings);
        setEnabled(result.settings.enabled);
        setEmailFrom(result.settings.emailFrom);
        setApiKey("");
        showFeedback({
          type: "success",
          text: t(
            "site_email_templates.resend.saved",
            "Resend iestatījumi saglabāti.",
          ),
        });
        return;
      }
      showFeedback({ type: "error", text: translateActionError(t, result) });
    });
  }

  function handleSaveTemplates(event: React.FormEvent) {
    event.preventDefault();
    clearFeedback();
    if (!templatesDirty) return;

    startTransition(async () => {
      const result = await saveEmailTemplatesAction(templates);
      if (result.ok) {
        const next = cloneTemplates(templates);
        setTemplates(next);
        setSavedTemplates(cloneTemplates(next));
        showFeedback({
          type: "success",
          text: t(
            "site_email_templates.templates.saved",
            "E-pasta šabloni saglabāti.",
          ),
        });
        return;
      }
      showFeedback({ type: "error", text: translateActionError(t, result) });
    });
  }

  return (
    <div className="space-y-8">
      <form
        onSubmit={handleSaveResend}
        className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm md:p-6"
      >
        <fieldset disabled={isPending} className="space-y-5 disabled:opacity-80">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-zinc-900">
                {t(
                  "site_email_templates.resend.section",
                  "Resend integrācija",
                )}
              </h2>
              <p className="mt-1 text-xs text-zinc-500">
                {t(
                  "site_email_templates.resend.section_hint",
                  "Kad ieslēgts, uzaicinājumi un pieejas paziņojumi tiek sūtīti caur Resend ar zemāk esošajiem šabloniem. Bez API atslēgas un sūtītāja adreses e-pasti netiek sūtīti.",
                )}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-zinc-700">
                {t("site_email_templates.resend.enabled", "Ieslēgt Resend")}
              </span>
              <Switch
                checked={enabled}
                disabled={isPending}
                label={t(
                  "site_email_templates.resend.enabled",
                  "Ieslēgt Resend",
                )}
                onChange={(next) => {
                  clearFeedback();
                  setEnabled(next);
                }}
              />
            </div>
          </div>

          <div>
            <label htmlFor="emailFrom" className={labelClassName}>
              {t(
                "site_email_templates.resend.email_from",
                "Sūtītāja adrese (From)",
              )}
            </label>
            <input
              id="emailFrom"
              value={emailFrom}
              onChange={(event) => {
                clearFeedback();
                setEmailFrom(event.target.value);
              }}
              className={fieldClassName}
              placeholder="Estimate Builder <noreply@yourdomain.com>"
              autoComplete="off"
            />
            <p className="mt-1 text-xs text-zinc-500">
              {t(
                "site_email_templates.resend.email_from_hint",
                "Piemērs: Estimate Builder <noreply@yourdomain.com>. Domēnam jābūt verificētam Resend.",
              )}
            </p>
          </div>

          <div>
            <label htmlFor="resendApiKey" className={labelClassName}>
              {t(
                "site_email_templates.resend.api_key",
                "Resend API atslēga",
              )}
            </label>
            <input
              id="resendApiKey"
              type="password"
              value={apiKey}
              onChange={(event) => {
                clearFeedback();
                setApiKey(event.target.value);
              }}
              className={fieldClassName}
              placeholder={
                savedResend.hasStoredApiKey ? "••••••••••••••••" : "re_…"
              }
              autoComplete="new-password"
            />
            <p className="mt-1 text-xs text-zinc-500">
              {savedResend.hasStoredApiKey
                ? t(
                    "site_email_templates.resend.api_key_hint_set",
                    "Atslēga ir saglabāta. Atstāj tukšu, lai saglabātu esošo, vai ievadi jaunu, lai aizstātu.",
                  )
                : t(
                    "site_email_templates.resend.api_key_hint_empty",
                    "Var arī iestatīt RESEND_API_KEY vides mainīgajā serverī.",
                  )}
            </p>
            {savedResend.hasEnvApiKey ? (
              <p className="mt-1 text-xs text-emerald-700">
                {t(
                  "site_email_templates.resend.env_key_configured",
                  "Serverī ir iestatīts RESEND_API_KEY (vides mainīgais).",
                )}
              </p>
            ) : null}
          </div>

          <div className="flex justify-end border-t border-zinc-100 pt-5">
            <button
              type="submit"
              disabled={isPending || !resendDirty}
              className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPending && resendDirty ? (
                <i
                  className="fas fa-circle-notch fa-spin text-xs"
                  aria-hidden="true"
                />
              ) : null}
              {t(
                "site_email_templates.resend.save",
                "Saglabāt Resend iestatījumus",
              )}
            </button>
          </div>
        </fieldset>
      </form>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
        <form
          onSubmit={handleSaveTemplates}
          className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm md:p-6"
        >
          <fieldset
            disabled={isPending}
            className="space-y-5 disabled:opacity-80"
          >
            <div>
              <h2 className="text-sm font-semibold text-zinc-900">
                {t(
                  "site_email_templates.templates.section",
                  "E-pasta šabloni",
                )}
              </h2>
              <p className="mt-1 text-xs text-zinc-500">
                {t(
                  "site_email_templates.templates.section_hint",
                  "Teksti ir katrā sistēmas valodā — pārslēdz valodu, lai rediģētu un apskatītu. Parametri: {name}, {company}, {system}; HTML pogai {link}.",
                )}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {templates.map((template) => {
                const label = TEMPLATE_LABEL_KEYS[template.kind];
                const active = template.kind === activeKind;
                return (
                  <button
                    key={template.kind}
                    type="button"
                    onClick={() => setActiveKind(template.kind)}
                    className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                      active
                        ? "bg-zinc-900 text-white"
                        : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                    }`}
                  >
                    {t(label.key, label.fallback)}
                  </button>
                );
              })}
            </div>

            {languages.length > 0 ? (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  {t(
                    "site_email_templates.language.switcher",
                    "Valoda",
                  )}
                </p>
                <div
                  role="tablist"
                  aria-label={t(
                    "site_email_templates.language.switcher",
                    "Valoda",
                  )}
                  className="flex flex-wrap gap-2"
                >
                  {languages.map((language) => {
                    const active = language.code === editLang;
                    return (
                      <button
                        key={language.code}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        onClick={() => setEditLang(language.code)}
                        className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                          active
                            ? "bg-zinc-900 text-white"
                            : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                        }`}
                      >
                        <span>{language.name}</span>
                        <span
                          className={`font-mono text-[11px] uppercase ${
                            active ? "text-zinc-300" : "text-zinc-400"
                          }`}
                        >
                          {language.code}
                        </span>
                        {!language.isActive ? (
                          <span
                            className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                              active
                                ? "bg-white/15 text-zinc-200"
                                : "bg-zinc-200 text-zinc-500"
                            }`}
                          >
                            {t(
                              "site_email_templates.language.inactive",
                              "Neaktīva",
                            )}
                          </span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {activeTemplate && activeLanguage ? (
              <div className="space-y-4 rounded-xl border border-zinc-100 bg-zinc-50/60 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  {activeLanguage.name} ({activeLanguage.code})
                </p>
                <div>
                  <label
                    htmlFor={`${activeTemplate.kind}-subject-${activeLanguage.code}`}
                    className={labelClassName}
                  >
                    {t("site_email_templates.field.subject", "Temats")}
                  </label>
                  <input
                    id={`${activeTemplate.kind}-subject-${activeLanguage.code}`}
                    value={activeTemplate.subjects[activeLanguage.code] ?? ""}
                    onChange={(event) =>
                      updateTemplateField(
                        activeTemplate.kind,
                        activeLanguage.code,
                        "subjects",
                        event.target.value,
                      )
                    }
                    className={fieldClassName}
                  />
                </div>
                <div>
                  <label
                    htmlFor={`${activeTemplate.kind}-body-${activeLanguage.code}`}
                    className={labelClassName}
                  >
                    {t("site_email_templates.field.body", "Saturs")}
                  </label>
                  <textarea
                    id={`${activeTemplate.kind}-body-${activeLanguage.code}`}
                    value={activeTemplate.bodies[activeLanguage.code] ?? ""}
                    onChange={(event) =>
                      updateTemplateField(
                        activeTemplate.kind,
                        activeLanguage.code,
                        "bodies",
                        event.target.value,
                      )
                    }
                    rows={
                      activeTemplate.kind === "invite" ||
                      activeTemplate.kind === "signup"
                        ? 6
                        : 8
                    }
                    className={`${fieldClassName} resize-y font-mono text-[13px] leading-relaxed`}
                  />
                </div>
                {activeTemplate.kind === "invite" ||
                activeTemplate.kind === "signup" ? (
                  <div>
                    <label
                      htmlFor={`${activeTemplate.kind}-button-${activeLanguage.code}`}
                      className={labelClassName}
                    >
                      {t(
                        "site_email_templates.field.button",
                        "Pogas teksts",
                      )}
                    </label>
                    <input
                      id={`${activeTemplate.kind}-button-${activeLanguage.code}`}
                      value={
                        activeTemplate.buttons?.[activeLanguage.code] ?? ""
                      }
                      onChange={(event) =>
                        updateTemplateField(
                          activeTemplate.kind,
                          activeLanguage.code,
                          "buttons",
                          event.target.value,
                        )
                      }
                      className={fieldClassName}
                    />
                  </div>
                ) : null}
              </div>
            ) : null}

            <div className="flex justify-end border-t border-zinc-100 pt-5">
              <button
                type="submit"
                disabled={isPending || !templatesDirty}
                className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isPending && templatesDirty ? (
                  <i
                    className="fas fa-circle-notch fa-spin text-xs"
                    aria-hidden="true"
                  />
                ) : null}
                {t(
                  "site_email_templates.templates.save",
                  "Saglabāt šablonus",
                )}
              </button>
            </div>
          </fieldset>
        </form>

        <aside className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
              {t("site_email_templates.preview.title", "Priekšskatījums")}
            </p>
            {activeLanguage ? (
              <span className="rounded-lg bg-zinc-100 px-2 py-1 font-mono text-[11px] uppercase text-zinc-500">
                {activeLanguage.code}
              </span>
            ) : null}
          </div>
          <p className="mt-3 text-sm font-semibold text-zinc-900">
            {previewSubject || "—"}
          </p>
          {activeKind === "invite" || activeKind === "signup" ? (
            invitePreviewHtml ? (
            <div className="mt-3 overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100">
              <iframe
                title={t("site_email_templates.preview.title", "Priekšskatījums")}
                srcDoc={invitePreviewHtml}
                className="h-[420px] w-full border-0 bg-white"
                sandbox=""
              />
            </div>
            ) : null
          ) : (
            <div className="mt-3 whitespace-pre-wrap rounded-xl bg-zinc-50 p-3 text-sm leading-relaxed text-zinc-700">
              {previewBody || "—"}
            </div>
          )}
        </aside>
      </div>

      {isDirty ? (
        <UnsavedChangesConfirmModal
          open={confirmOpen}
          onStay={stayOnPage}
          onLeave={confirmLeave}
        />
      ) : null}
    </div>
  );
}
