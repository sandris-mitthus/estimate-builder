"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { saveEmailTemplatesAction } from "@/app/(protected)/site_email_templates/actions";
import { useFeedbackToast } from "@/app/components/feedback-toast-provider";
import { UnsavedChangesConfirmModal } from "@/app/components/unsaved-changes-confirm-modal";
import { useTranslations } from "@/app/components/translations-provider";
import { useUnsavedChangesGuard } from "@/app/lib/hooks/use-unsaved-changes-guard";
import { translateActionError } from "@/app/lib/i18n/action-errors";
import { interpolateTranslation } from "@/app/lib/i18n/translations";
import { buildInviteEmailHtml } from "@/app/lib/email/build-invite-email-html";
import type {
  EmailTemplateDraft,
  EmailTemplateKind,
} from "@/app/lib/email/templates";
import { emailTemplateHasButton } from "@/app/lib/email/templates";
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
  password_reset: {
    key: "site_email_templates.template.password_reset",
    fallback: "Paroles atjaunošana",
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

const BUTTON_PREVIEW_FALLBACK: Record<string, string> = {
  invite: "Apstiprināt uzaicinājumu",
  signup: "Apstiprināt e-pastu",
  password_reset: "Atjaunot paroli",
};

const PREVIEW_PARAMS = {
  name: "Jānis Bērziņš",
  company: "Demo SIA",
  system: "Estimate Builder",
  link: "https://example.com/auth/confirm#…",
};

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
  resendEnabled,
  initialTemplates,
  languages,
}: {
  /** Read-only here: Resend is configured under /site_integrations. */
  resendEnabled: boolean;
  initialTemplates: EmailTemplateDraft[];
  languages: SiteLanguageSummary[];
}) {
  const { t } = useTranslations();
  const { showFeedback, clearFeedback } = useFeedbackToast();
  const [isPending, startTransition] = useTransition();

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

  const isDirty = !templatesEqual(templates, savedTemplates);

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
    activeTemplate && emailTemplateHasButton(activeTemplate.kind)
      ? interpolateTranslation(
          activeTemplate.buttons?.[editLang] ??
            activeTemplate.buttons?.lv ??
            BUTTON_PREVIEW_FALLBACK[activeTemplate.kind] ??
            "",
          PREVIEW_PARAMS,
        )
      : "";
  const invitePreviewHtml =
    activeTemplate && emailTemplateHasButton(activeTemplate.kind)
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

  function handleSaveTemplates(event: React.FormEvent) {
    event.preventDefault();
    clearFeedback();
    if (!isDirty) return;

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
      {resendEnabled ? null : (
        <p className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
          {t(
            "site_email_templates.resend_disabled_notice",
            "Resend ir izslēgts, tāpēc e-pasti netiek sūtīti. Ieslēdz to sadaļā Integrācijas.",
          )}{" "}
          <Link
            href="/site_integrations"
            className="font-semibold underline underline-offset-2"
          >
            {t("nav.system_admin.site_integrations", "Integrācijas")}
          </Link>
        </p>
      )}

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
                      emailTemplateHasButton(activeTemplate.kind) ? 6 : 8
                    }
                    className={`${fieldClassName} resize-y font-mono text-[13px] leading-relaxed`}
                  />
                </div>
                {emailTemplateHasButton(activeTemplate.kind) ? (
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
                disabled={isPending || !isDirty}
                className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isPending && isDirty ? (
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
          {emailTemplateHasButton(activeKind) ? (
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
