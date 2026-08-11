"use client";

import { useMemo, useState, useTransition } from "react";
import { saveSiteSettingsAction } from "@/app/(protected)/site_settings/actions";
import { useFeedbackToast } from "@/app/components/feedback-toast-provider";
import { SiteBrandingDropzone } from "@/app/components/site-branding-dropzone";
import { useTranslations } from "@/app/components/translations-provider";
import { formatDisplayDateDdMmYy } from "@/app/lib/format-display-date";
import { translateActionError } from "@/app/lib/i18n/action-errors";
import {
  resolveLocalizedValue,
  type LocalizedValues,
} from "@/app/lib/i18n/localized-values";
import { isValidEmail } from "@/app/lib/validation/contact-fields";
import type {
  SiteSettingsInput,
  SiteSettingsSummary,
} from "@/app/lib/site-admin/repository";
import type { SiteLanguageSummary } from "@/app/lib/site-admin/types";

const fieldClassName =
  "mt-2 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100";
const labelClassName = "text-sm font-medium text-zinc-800";

function emptyValues(languages: SiteLanguageSummary[]): LocalizedValues {
  return Object.fromEntries(languages.map((language) => [language.code, ""]));
}

function mergeSloganValues(
  languages: SiteLanguageSummary[],
  values: LocalizedValues,
): LocalizedValues {
  const next = emptyValues(languages);
  for (const [code, value] of Object.entries(values)) {
    next[code] = value;
  }
  return next;
}

function sloganValuesEqual(left: LocalizedValues, right: LocalizedValues): boolean {
  const keys = new Set([...Object.keys(left), ...Object.keys(right)]);
  for (const key of keys) {
    if ((left[key] ?? "").trim() !== (right[key] ?? "").trim()) {
      return false;
    }
  }
  return true;
}

function toInput(
  settings: SiteSettingsSummary,
  languages: SiteLanguageSummary[],
): SiteSettingsInput {
  return {
    systemName: settings.systemName,
    sloganValues: mergeSloganValues(languages, settings.sloganValues),
    controllerName: settings.controllerName,
    controllerRegistrationNumber: settings.controllerRegistrationNumber,
    controllerAddress: settings.controllerAddress,
    controllerEmail: settings.controllerEmail,
  };
}

export function SiteSettingsForm({
  initialSettings,
  languages,
}: {
  initialSettings: SiteSettingsSummary;
  languages: SiteLanguageSummary[];
}) {
  const [settings, setSettings] = useState<SiteSettingsInput>(() =>
    toInput(initialSettings, languages),
  );
  const [savedSettings, setSavedSettings] = useState(initialSettings);
  const [logoUrl, setLogoUrl] = useState(initialSettings.logoUrl);
  const [faviconUrl, setFaviconUrl] = useState(initialSettings.faviconUrl);
  const [editLang, setEditLang] = useState(
    () => languages.find((language) => language.isDefault)?.code ?? languages[0]?.code ?? "lv",
  );
  const [isPending, startTransition] = useTransition();
  const { showFeedback, clearFeedback } = useFeedbackToast();
  const { t, languageCode } = useTranslations();
  const savedInput = useMemo(
    () => toInput(savedSettings, languages),
    [savedSettings, languages],
  );
  const hasChanges =
    settings.systemName !== savedInput.systemName ||
    settings.controllerName !== savedInput.controllerName ||
    settings.controllerRegistrationNumber !==
      savedInput.controllerRegistrationNumber ||
    settings.controllerAddress !== savedInput.controllerAddress ||
    settings.controllerEmail !== savedInput.controllerEmail ||
    !sloganValuesEqual(settings.sloganValues, savedInput.sloganValues);

  const previewSlogan =
    resolveLocalizedValue(settings.sloganValues, languageCode) ||
    resolveLocalizedValue(settings.sloganValues, editLang) ||
    "—";

  function updateField<K extends keyof SiteSettingsInput>(
    key: K,
    value: SiteSettingsInput[K],
  ) {
    setSettings((current) => ({ ...current, [key]: value }));
    clearFeedback();
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearFeedback();

    if (!hasChanges) {
      return;
    }

    if (!settings.systemName.trim()) {
      showFeedback({
        type: "error",
        text: t(
          "site_settings.validation.system_name_required",
          "Ievadi sistēmas nosaukumu.",
        ),
      });
      return;
    }

    if (
      !Object.values(settings.sloganValues).some((value) => value.trim())
    ) {
      showFeedback({
        type: "error",
        text: t(
          "site_settings.validation.slogan_required",
          "Ievadi sistēmas sloganu vismaz vienā valodā.",
        ),
      });
      return;
    }

    const controllerEmail = settings.controllerEmail.trim();
    if (controllerEmail && !isValidEmail(controllerEmail)) {
      showFeedback({
        type: "error",
        text: t(
          "site_settings.validation.controller_email_invalid",
          "Ievadi derīgu pārziņa e-pasta adresi.",
        ),
      });
      return;
    }

    startTransition(async () => {
      const result = await saveSiteSettingsAction(settings);

      if (result.ok) {
        setSettings(toInput(result.settings, languages));
        setSavedSettings(result.settings);
        setLogoUrl(result.settings.logoUrl);
        setFaviconUrl(result.settings.faviconUrl);
        showFeedback({
          type: "success",
          text: t(
            "site_settings.feedback.saved",
            "Sistēmas uzstādījumi saglabāti.",
          ),
        });
        return;
      }

      showFeedback({ type: "error", text: translateActionError(t, result) });
    });
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm md:p-6"
      >
        <fieldset disabled={isPending} className="space-y-5 disabled:opacity-80">
          <div>
            <label htmlFor="systemName" className={labelClassName}>
              {t("site_settings.form.system_name", "Sistēmas nosaukums")}
            </label>
            <input
              id="systemName"
              value={settings.systemName}
              onChange={(event) => updateField("systemName", event.target.value)}
              className={fieldClassName}
              placeholder="Estimate Builder"
            />
          </div>

          <div>
            <div className="flex flex-wrap items-end justify-between gap-3">
              <label htmlFor="slogan" className={labelClassName}>
                {t("site_settings.form.slogan", "Slogans")}
                {languages.length > 1 ? (
                  <span className="ml-1 font-mono text-xs uppercase text-zinc-400">
                    ({editLang})
                  </span>
                ) : null}
              </label>
            </div>
            <p className="mt-1 text-xs text-zinc-500">
              {t(
                "site_settings.form.slogan_hint",
                "Norādi sloganu katrai sistēmas valodai. Landing un metadati izmanto aktīvās valodas tekstu.",
              )}
            </p>
            {languages.length > 1 ? (
              <div
                role="tablist"
                aria-label={t("site_languages.page.title", "Valodas")}
                className="mt-2 flex flex-wrap gap-2"
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
                    </button>
                  );
                })}
              </div>
            ) : null}
            <textarea
              id="slogan"
              value={settings.sloganValues[editLang] ?? ""}
              onChange={(event) =>
                updateField("sloganValues", {
                  ...settings.sloganValues,
                  [editLang]: event.target.value,
                })
              }
              rows={3}
              className={`${fieldClassName} resize-y`}
              placeholder={t(
                "site_settings.form.slogan_placeholder",
                "Tāmes piedāvājumu veidošana",
              )}
            />
          </div>

          <div className="space-y-5 border-t border-zinc-100 pt-5">
            <div>
              <h2 className="text-sm font-semibold text-zinc-900">
                {t("site_settings.form.branding_section", "Zīmols")}
              </h2>
              <p className="mt-1 text-xs text-zinc-500">
                {t(
                  "site_settings.form.branding_section_hint",
                  "Logotips redzams sānu joslā un pieteikšanās logā. Favicon — pārlūka cilnē.",
                )}
              </p>
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
              <SiteBrandingDropzone
                kind="logo"
                url={logoUrl}
                onUrlChange={setLogoUrl}
              />
              <SiteBrandingDropzone
                kind="favicon"
                url={faviconUrl}
                onUrlChange={setFaviconUrl}
              />
            </div>
          </div>

          <div className="space-y-5 border-t border-zinc-100 pt-5">
            <div>
              <h2 className="text-sm font-semibold text-zinc-900">
                {t(
                  "site_settings.form.controller_section",
                  "Pārzinis juridiskajos dokumentos",
                )}
              </h2>
              <p className="mt-1 text-xs text-zinc-500">
                {t(
                  "site_settings.form.controller_section_hint",
                  'Šos rekvizītus rāda privātuma politikas sadaļā par pārzini. Ja lauks ir tukšs, dokumentā redzams "Nav norādīts".',
                )}
              </p>
            </div>

            <div>
              <label htmlFor="controllerName" className={labelClassName}>
                {t("site_settings.form.controller_name", "Pārziņa nosaukums")}
              </label>
              <input
                id="controllerName"
                value={settings.controllerName}
                onChange={(event) =>
                  updateField("controllerName", event.target.value)
                }
                className={fieldClassName}
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="controllerRegistrationNumber"
                  className={labelClassName}
                >
                  {t(
                    "site_settings.form.controller_registration_number",
                    "Reģistrācijas numurs",
                  )}
                </label>
                <input
                  id="controllerRegistrationNumber"
                  value={settings.controllerRegistrationNumber}
                  onChange={(event) =>
                    updateField(
                      "controllerRegistrationNumber",
                      event.target.value,
                    )
                  }
                  className={fieldClassName}
                />
              </div>
              <div>
                <label htmlFor="controllerEmail" className={labelClassName}>
                  {t("site_settings.form.controller_email", "E-pasts")}
                </label>
                <input
                  id="controllerEmail"
                  type="email"
                  value={settings.controllerEmail}
                  onChange={(event) =>
                    updateField("controllerEmail", event.target.value)
                  }
                  className={fieldClassName}
                />
              </div>
            </div>

            <div>
              <label htmlFor="controllerAddress" className={labelClassName}>
                {t("site_settings.form.controller_address", "Juridiskā adrese")}
              </label>
              <input
                id="controllerAddress"
                value={settings.controllerAddress}
                onChange={(event) =>
                  updateField("controllerAddress", event.target.value)
                }
                className={fieldClassName}
                placeholder="Brīvības iela 1, Rīga, LV-1010"
              />
            </div>
          </div>

          <div className="flex justify-end border-t border-zinc-100 pt-5">
            <button
              type="submit"
              disabled={isPending || !hasChanges}
              className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPending ? (
                <i
                  className="fas fa-circle-notch fa-spin text-xs"
                  aria-hidden="true"
                />
              ) : null}
              {isPending
                ? t("actions.saving", "Saglabā…")
                : t("actions.save", "Saglabāt")}
            </button>
          </div>
        </fieldset>
      </form>

      <aside className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
          {t("site_settings.preview.title", "Priekšskatījums")}
        </p>
        <div className="mt-3 flex items-center gap-3">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt=""
              className="size-10 shrink-0 rounded-lg border border-zinc-200 object-contain p-1"
            />
          ) : null}
          <div className="min-w-0">
            <h2 className="truncate text-lg font-semibold text-zinc-900">
              {settings.systemName || "—"}
            </h2>
            <p className="mt-1 text-sm text-zinc-500">{previewSlogan}</p>
          </div>
        </div>
        <div className="mt-5 rounded-xl bg-zinc-50 p-3 text-xs text-zinc-500">
          {t(
            "site_settings.preview.description",
            "Šīs vērtības tiek izmantotas pārlūka virsrakstā un lapas apraksta metadatos.",
          )}
        </div>
        {savedSettings.updatedAt ? (
          <p className="mt-4 text-xs text-zinc-400">
            {t(
              "site_settings.preview.last_saved",
              "Pēdējās saglabātās izmaiņas:",
            )}{" "}
            {formatDisplayDateDdMmYy(savedSettings.updatedAt) || "—"}
          </p>
        ) : null}
      </aside>
    </div>
  );
}
