"use client";

import { useState, useTransition } from "react";
import { saveSiteSettingsAction } from "@/app/(protected)/site_settings/actions";
import { useFeedbackToast } from "@/app/components/feedback-toast-provider";
import { useTranslations } from "@/app/components/translations-provider";
import { formatDisplayDateDdMmYy } from "@/app/lib/format-display-date";
import { translateActionError } from "@/app/lib/i18n/action-errors";
import type {
  SiteSettingsInput,
  SiteSettingsSummary,
} from "@/app/lib/site-admin/repository";

export function SiteSettingsForm({
  initialSettings,
}: {
  initialSettings: SiteSettingsSummary;
}) {
  const [settings, setSettings] = useState<SiteSettingsInput>({
    systemName: initialSettings.systemName,
    slogan: initialSettings.slogan,
  });
  const [savedSettings, setSavedSettings] = useState(initialSettings);
  const [isPending, startTransition] = useTransition();
  const { showFeedback, clearFeedback } = useFeedbackToast();
  const { t } = useTranslations();
  const hasChanges =
    settings.systemName !== savedSettings.systemName ||
    settings.slogan !== savedSettings.slogan;

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
        text: t("site_settings.validation.system_name_required", "Ievadi sistēmas nosaukumu."),
      });
      return;
    }

    if (!settings.slogan.trim()) {
      showFeedback({
        type: "error",
        text: t("site_settings.validation.slogan_required", "Ievadi sistēmas sloganu."),
      });
      return;
    }

    startTransition(async () => {
      const result = await saveSiteSettingsAction(settings);

      if (result.ok) {
        setSettings({
          systemName: result.settings.systemName,
          slogan: result.settings.slogan,
        });
        setSavedSettings(result.settings);
        showFeedback({
          type: "success",
          text: t("site_settings.feedback.saved", "Sistēmas uzstādījumi saglabāti."),
        });
        return;
      }

      showFeedback({ type: "error", text: translateActionError(t, result) });
    });
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
      <form onSubmit={handleSubmit} className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm md:p-6">
        <fieldset disabled={isPending} className="space-y-5 disabled:opacity-80">
          <div>
            <label
              htmlFor="systemName"
              className="text-sm font-medium text-zinc-800"
            >
              {t("site_settings.form.system_name", "Sistēmas nosaukums")}
            </label>
            <input
              id="systemName"
              value={settings.systemName}
              onChange={(event) => updateField("systemName", event.target.value)}
              className="mt-2 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100"
              placeholder="Estimate Builder"
            />
          </div>

          <div>
            <label htmlFor="slogan" className="text-sm font-medium text-zinc-800">
              {t("site_settings.form.slogan", "Slogans")}
            </label>
            <textarea
              id="slogan"
              value={settings.slogan}
              onChange={(event) => updateField("slogan", event.target.value)}
              rows={3}
              className="mt-2 w-full resize-y rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100"
              placeholder={t(
                "site_settings.form.slogan_placeholder",
                "Tāmes piedāvājumu veidošana",
              )}
            />
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
        <h2 className="mt-2 text-lg font-semibold text-zinc-900">
          {settings.systemName || "—"}
        </h2>
        <p className="mt-2 text-sm text-zinc-500">{settings.slogan || "—"}</p>
        <div className="mt-5 rounded-xl bg-zinc-50 p-3 text-xs text-zinc-500">
          {t(
            "site_settings.preview.description",
            "Šīs vērtības tiek izmantotas pārlūka virsrakstā un lapas apraksta metadatos.",
          )}
        </div>
        {savedSettings.updatedAt ? (
          <p className="mt-4 text-xs text-zinc-400">
            {t("site_settings.preview.last_saved", "Pēdējās saglabātās izmaiņas:")}{" "}
            {formatDisplayDateDdMmYy(savedSettings.updatedAt) || "—"}
          </p>
        ) : null}
      </aside>
    </div>
  );
}
