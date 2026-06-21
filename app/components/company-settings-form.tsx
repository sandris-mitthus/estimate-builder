"use client";

import { useMemo, useState, useTransition, type ReactNode } from "react";
import { saveCompanySettingsAction } from "@/app/(protected)/settings/actions";
import { CompanyLogoDropzone } from "@/app/components/company-logo-dropzone";
import { InputWithSuffix } from "@/app/components/input-with-suffix";
import { useActionPermission } from "@/app/components/action-permissions-context";
import { useFeedbackToast } from "@/app/components/feedback-toast-provider";
import { useTranslations } from "@/app/components/translations-provider";
import { formatAmount } from "@/app/lib/estimates/calculate-line";
import { translateActionError } from "@/app/lib/i18n/action-errors";
import type { TranslationParams } from "@/app/lib/i18n/translations";
import { CURRENCY_OPTIONS } from "@/app/lib/settings/currencies";
import { parseDefaultHourlyRateInput } from "@/app/lib/settings/default-hourly-rate";
import {
  parseEstimateValidityDaysInput,
} from "@/app/lib/settings/estimate-validity-days";
import { formatCompanyDisplayLines } from "@/app/lib/settings/format-company-lines";
import { parseOfferAdditionalInfoLines } from "@/app/lib/settings/offer-additional-info";
import { resolveBankFromAccountNumber } from "@/app/lib/settings/resolve-bank-from-account";
import type { CompanySettings } from "@/app/lib/settings/types";

const inputClassName =
  "w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 transition placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/5";

function FormField({
  label,
  id,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  id: keyof CompanySettings;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label htmlFor={id} className="block">
      <span className="mb-1.5 block text-sm font-medium text-zinc-700">
        {label}
      </span>
      <input
        id={id}
        name={id}
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className={inputClassName}
      />
    </label>
  );
}

function SettingsSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-4">
      <h2 className="text-sm font-semibold text-zinc-900">{title}</h2>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}

type Translate = (
  key: string,
  fallback?: string,
  params?: TranslationParams,
) => string;

function CompanyPreview({
  settings,
  t,
}: {
  settings: CompanySettings;
  t: Translate;
}) {
  const lines = useMemo(() => formatCompanyDisplayLines(settings), [settings]);
  const currencyLabel =
    CURRENCY_OPTIONS.find((option) => option.value === settings.currency)
      ?.label ?? settings.currency;

  return (
    <div className="rounded-2xl border border-zinc-200 bg-zinc-50/80 p-5">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
        {t("site_settings.preview.title", "Priekšskatījums")}
      </p>
      {settings.logoUrl ? (
        <div className="mt-4 flex h-16 items-center">
          <img
            src={settings.logoUrl}
            alt={t("settings.company_logo", "Uzņēmuma logotips")}
            className="max-h-16 max-w-full object-contain"
          />
        </div>
      ) : null}
      {lines.length > 0 ? (
        <div className="mt-4 space-y-1.5 text-sm text-zinc-800">
          {lines.map((line, index) => (
            <p key={`${line.label ?? "line"}-${index}`}>
              {line.label ? (
                <>
                  <span className="text-zinc-500">{line.label}: </span>
                  {line.value}
                </>
              ) : (
                <span className={index === 0 ? "font-semibold text-zinc-900" : ""}>
                  {line.value}
                </span>
              )}
            </p>
          ))}
        </div>
      ) : (
        <p className="mt-4 text-sm text-zinc-500">
          {t("settings.preview.empty", "Aizpildi laukus, lai redzētu uzņēmuma datus.")}
        </p>
      )}
      <p className="mt-5 border-t border-zinc-200/80 pt-4 text-sm text-zinc-600">
        <span className="text-zinc-500">{t("settings.currency", "Valūta")}: </span>
        {currencyLabel}
      </p>
      <p className="mt-3 text-sm text-zinc-600">
        <span className="text-zinc-500">
          {t("settings.estimate_validity", "Tāmes derīgums")}:{" "}
        </span>
        {settings.estimateValidityDays > 0
          ? t("common.days_count", "{count} dienas", {
              count: settings.estimateValidityDays,
            })
          : "—"}
      </p>
      <p className="mt-3 text-sm text-zinc-600">
        <span className="text-zinc-500">
          {t("settings.hourly_rate", "Stundas likme")}:{" "}
        </span>
        {settings.defaultHourlyRate !== null
          ? `${formatAmount(settings.defaultHourlyRate)} ${settings.currency}`
          : "—"}
      </p>
      {!settings.vatNumber.trim() ? (
        <p className="mt-3 text-xs text-zinc-400">
          {t(
            "settings.preview.vat_hidden",
            "PVN numurs netiks rādīts, kamēr lauks ir tukšs.",
          )}
        </p>
      ) : null}
      {parseOfferAdditionalInfoLines(settings.offerAdditionalInfo).length > 0 ||
      settings.offerValidityDays > 0 ? (
        <div className="mt-5 border-t border-zinc-200/80 pt-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
            {t("settings.preview.offer_notes", "Piedāvājuma piezīmes")}
          </p>
          <ul className="mt-2 space-y-1.5 text-sm text-zinc-600">
            {parseOfferAdditionalInfoLines(settings.offerAdditionalInfo).map(
              (line, index) => (
                <li key={`${index}-${line.slice(0, 24)}`}>{line}</li>
              ),
            )}
          </ul>
          {settings.offerValidityDays > 0 ? (
            <p className="mt-3 text-sm font-semibold text-zinc-800">
              {t("settings.preview.offer_validity", "Piedāvājums spēkā {count} dienas", {
                count: settings.offerValidityDays,
              })}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export function CompanySettingsForm({
  initialSettings,
}: {
  initialSettings: CompanySettings;
}) {
  const [settings, setSettings] = useState(initialSettings);
  const [hourlyRateInput, setHourlyRateInput] = useState(() =>
    initialSettings.defaultHourlyRate !== null
      ? formatAmount(initialSettings.defaultHourlyRate)
      : "",
  );
  const { showFeedback, clearFeedback } = useFeedbackToast();
  const { t } = useTranslations();
  const canSave = useActionPermission("settings.save");
  const [isPending, startTransition] = useTransition();

  function updateField<K extends keyof CompanySettings>(
    key: K,
    value: CompanySettings[K],
  ) {
    setSettings((current) => ({ ...current, [key]: value }));
    clearFeedback();
  }

  function updateBankAccountNumber(value: string) {
    const resolved = resolveBankFromAccountNumber(value);

    setSettings((current) => ({
      ...current,
      bankAccountNumber: value,
      ...(resolved
        ? { bankName: resolved.bankName, swift: resolved.swift }
        : {}),
    }));
    clearFeedback();
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearFeedback();

    if (settings.estimateValidityDays < 1) {
      showFeedback({
        type: "error",
        text: t(
          "settings.validation.estimate_validity_required",
          "Ievadi tāmes derīguma termiņu dienās.",
        ),
      });
      return;
    }

    if (settings.offerValidityDays < 1) {
      showFeedback({
        type: "error",
        text: t(
          "settings.validation.offer_validity_required",
          "Ievadi piedāvājuma derīguma termiņu dienās.",
        ),
      });
      return;
    }

    const parsedHourlyRate = parseDefaultHourlyRateInput(hourlyRateInput);
    if (hourlyRateInput.trim() && parsedHourlyRate === null) {
      showFeedback({
        type: "error",
        text: t("settings.validation.hourly_rate_invalid", "Ievadi derīgu stundas likmi."),
      });
      return;
    }

    const settingsToSave = {
      ...settings,
      defaultHourlyRate: parsedHourlyRate,
    };

    startTransition(async () => {
      const result = await saveCompanySettingsAction(settingsToSave);

      if (result.ok) {
        setSettings(settingsToSave);
        showFeedback({
          type: "success",
          text: t("settings.feedback.saved", "Uzstādījumi saglabāti."),
        });
        return;
      }

      showFeedback({ type: "error", text: translateActionError(t, result) });
    });
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_386px] lg:items-start">
      <form onSubmit={handleSubmit} className="space-y-8">
        <fieldset disabled={!canSave} className="space-y-8 disabled:opacity-80">
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm md:p-6">
          <SettingsSection title={t("settings.section.company", "Uzņēmums")}>
            <CompanyLogoDropzone
              logoUrl={settings.logoUrl}
              onLogoChange={(logoUrl) => updateField("logoUrl", logoUrl)}
              onError={(text) =>
                text
                  ? showFeedback({ type: "error", text })
                  : clearFeedback()
              }
            />
            <div className="sm:col-span-2">
              <FormField
                label={t("settings.company_name", "Uzņēmuma nosaukums")}
                id="companyName"
                value={settings.companyName}
                onChange={(value) => updateField("companyName", value)}
              />
            </div>
            <div className="sm:col-span-2">
              <FormField
                label={t("settings.address", "Adrese")}
                id="address"
                value={settings.address}
                onChange={(value) => updateField("address", value)}
              />
            </div>
            <FormField
              label={t("settings.registration_number", "Reģistrācijas numurs")}
              id="registrationNumber"
              value={settings.registrationNumber}
              onChange={(value) => updateField("registrationNumber", value)}
            />
            <FormField
              label={t("settings.vat_number", "PVN numurs")}
              id="vatNumber"
              value={settings.vatNumber}
              placeholder={t("common.optional", "Nav obligāts")}
              onChange={(value) => updateField("vatNumber", value)}
            />
          </SettingsSection>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm md:p-6">
          <SettingsSection title={t("settings.section.bank", "Bankas rekvizīti")}>
            <div className="sm:col-span-2">
              <FormField
                label={t("settings.bank_account_number", "Bankas konta numurs")}
                id="bankAccountNumber"
                value={settings.bankAccountNumber}
                placeholder="LV… IBAN"
                onChange={updateBankAccountNumber}
              />
            </div>
            {settings.bankAccountNumber.trim() ? (
              <>
                <FormField
                  label={t("settings.bank_name", "Bankas nosaukums")}
                  id="bankName"
                  value={settings.bankName}
                  onChange={(value) => updateField("bankName", value)}
                />
                <FormField
                  label="SWIFT"
                  id="swift"
                  value={settings.swift}
                  onChange={(value) => updateField("swift", value)}
                />
              </>
            ) : null}
          </SettingsSection>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm md:p-6">
          <SettingsSection title={t("settings.section.estimate", "Tāme")}>
            <label htmlFor="estimateValidityDays" className="block">
              <span className="mb-1.5 block text-sm font-medium text-zinc-700">
                {t("settings.estimate_validity_term", "Tāmes derīguma termiņš")}
              </span>
              <InputWithSuffix
                id="estimateValidityDays"
                name="estimateValidityDays"
                suffix="dienas"
                inputMode="numeric"
                autoComplete="off"
                value={
                  settings.estimateValidityDays > 0
                    ? String(settings.estimateValidityDays)
                    : ""
                }
                onChange={(event) => {
                  const digits = parseEstimateValidityDaysInput(
                    event.target.value,
                  );
                  updateField(
                    "estimateValidityDays",
                    digits === "" ? 0 : Number.parseInt(digits, 10),
                  );
                }}
              />
            </label>
            <label htmlFor="defaultHourlyRate" className="block">
              <span className="mb-1.5 block text-sm font-medium text-zinc-700">
                {t("settings.default_hourly_rate", "Darbinieka standarta stundas likme")}
              </span>
              <InputWithSuffix
                id="defaultHourlyRate"
                name="defaultHourlyRate"
                type="text"
                inputMode="decimal"
                autoComplete="off"
                suffix={settings.currency}
                value={hourlyRateInput}
                onChange={(event) => {
                  const value = event.target.value;
                  setHourlyRateInput(value);
                  const parsed = parseDefaultHourlyRateInput(value);
                  updateField(
                    "defaultHourlyRate",
                    value.trim() === "" ? null : parsed,
                  );
                  clearFeedback();
                }}
              />
            </label>
          </SettingsSection>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm md:p-6">
          <SettingsSection title={t("settings.section.offer", "Piedāvājums")}>
            <label htmlFor="offerValidityDays" className="block">
              <span className="mb-1.5 block text-sm font-medium text-zinc-700">
                {t("settings.offer_validity_term", "Piedāvājuma derīguma termiņš")}
              </span>
              <span className="mb-2 block text-xs text-zinc-500">
                {t(
                  "settings.offer_validity_hint",
                  "PDF rāda treknrakstā: „Piedāvājums spēkā X dienas”.",
                )}
              </span>
              <InputWithSuffix
                id="offerValidityDays"
                name="offerValidityDays"
                suffix="dienas"
                inputMode="numeric"
                autoComplete="off"
                value={
                  settings.offerValidityDays > 0
                    ? String(settings.offerValidityDays)
                    : ""
                }
                onChange={(event) => {
                  const digits = parseEstimateValidityDaysInput(
                    event.target.value,
                  );
                  updateField(
                    "offerValidityDays",
                    digits === "" ? 0 : Number.parseInt(digits, 10),
                  );
                }}
              />
            </label>
            <div className="sm:col-span-2">
              <label htmlFor="offerAdditionalInfo" className="block">
                <span className="mb-1.5 block text-sm font-medium text-zinc-700">
                  {t("settings.offer_additional_info", "Papildus informācija piedāvājumam")}
                </span>
                <span className="mb-2 block text-xs text-zinc-500">
                  {t(
                    "settings.offer_additional_info_hint",
                    "Katra rinda tiek rādīta kā atsevišķs komentārs piedāvājuma PDF.",
                  )}
                </span>
                <textarea
                  id="offerAdditionalInfo"
                  name="offerAdditionalInfo"
                  rows={5}
                  value={settings.offerAdditionalInfo}
                  placeholder={
                    t(
                      "settings.offer_additional_info_placeholder",
                      "Pozīcijas, kas nav minētas piedāvājumā – nav iekļautas.\nPrecizējot un mainot pozīcijas cenas piedāvājums var tikt precizēts.",
                    )
                  }
                  onChange={(event) =>
                    updateField("offerAdditionalInfo", event.target.value)
                  }
                  className={`${inputClassName} resize-y min-h-[7.5rem]`}
                />
              </label>
            </div>
          </SettingsSection>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm md:p-6">
          <SettingsSection title={t("settings.section.contacts_currency", "Kontakti un valūta")}>
            <FormField
              label={t("settings.info_phone", "Info telefons")}
              id="phone"
              type="tel"
              value={settings.phone}
              onChange={(value) => updateField("phone", value)}
            />
            <FormField
              label={t("settings.info_email", "Info e-pasts")}
              id="email"
              type="email"
              value={settings.email}
              onChange={(value) => updateField("email", value)}
            />
            <div className="sm:col-span-2">
              <label htmlFor="currency" className="block">
                <span className="mb-1.5 block text-sm font-medium text-zinc-700">
                  {t("settings.currency", "Valūta")}
                </span>
                <select
                  id="currency"
                  name="currency"
                  value={settings.currency}
                  onChange={(event) =>
                    updateField("currency", event.target.value)
                  }
                  className={inputClassName}
                >
                  {CURRENCY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </SettingsSection>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {canSave ? (
          <button
            type="submit"
            disabled={isPending}
            className="rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? t("actions.saving", "Saglabā…") : t("actions.save", "Saglabāt")}
          </button>
          ) : null}
        </div>
        </fieldset>
      </form>

      <div className="lg:sticky lg:top-[4.5rem]">
        <CompanyPreview settings={settings} t={t} />
      </div>
    </div>
  );
}
