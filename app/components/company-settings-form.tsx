"use client";

import { useMemo, useState, useTransition, type ReactNode } from "react";
import { saveCompanySettingsAction } from "@/app/(protected)/settings/actions";
import { CompanyLogoDropzone } from "@/app/components/company-logo-dropzone";
import { InputWithSuffix } from "@/app/components/input-with-suffix";
import { useFeedbackToast } from "@/app/components/feedback-toast-provider";
import { formatAmount } from "@/app/lib/estimates/calculate-line";
import { CURRENCY_OPTIONS } from "@/app/lib/settings/currencies";
import { parseDefaultHourlyRateInput } from "@/app/lib/settings/default-hourly-rate";
import {
  parseEstimateValidityDaysInput,
} from "@/app/lib/settings/estimate-validity-days";
import { formatCompanyDisplayLines } from "@/app/lib/settings/format-company-lines";
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

function CompanyPreview({ settings }: { settings: CompanySettings }) {
  const lines = useMemo(() => formatCompanyDisplayLines(settings), [settings]);
  const currencyLabel =
    CURRENCY_OPTIONS.find((option) => option.value === settings.currency)
      ?.label ?? settings.currency;

  return (
    <div className="rounded-2xl border border-zinc-200 bg-zinc-50/80 p-5">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
        Priekšskatījums
      </p>
      {settings.logoUrl ? (
        <div className="mt-4 flex h-16 items-center">
          <img
            src={settings.logoUrl}
            alt="Uzņēmuma logotips"
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
          Aizpildi laukus, lai redzētu uzņēmuma datus.
        </p>
      )}
      <p className="mt-5 border-t border-zinc-200/80 pt-4 text-sm text-zinc-600">
        <span className="text-zinc-500">Valūta: </span>
        {currencyLabel}
      </p>
      <p className="mt-3 text-sm text-zinc-600">
        <span className="text-zinc-500">Tāmes derīgums: </span>
        {settings.estimateValidityDays > 0
          ? `${settings.estimateValidityDays} dienas`
          : "—"}
      </p>
      <p className="mt-3 text-sm text-zinc-600">
        <span className="text-zinc-500">Stundas likme: </span>
        {settings.defaultHourlyRate !== null
          ? `${formatAmount(settings.defaultHourlyRate)} ${settings.currency}`
          : "—"}
      </p>
      {!settings.vatNumber.trim() ? (
        <p className="mt-3 text-xs text-zinc-400">
          PVN numurs netiks rādīts, kamēr lauks ir tukšs.
        </p>
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
        text: "Ievadi tāmes derīguma termiņu dienās.",
      });
      return;
    }

    const parsedHourlyRate = parseDefaultHourlyRateInput(hourlyRateInput);
    if (hourlyRateInput.trim() && parsedHourlyRate === null) {
      showFeedback({
        type: "error",
        text: "Ievadi derīgu stundas likmi.",
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
        showFeedback({ type: "success", text: "Uzstādījumi saglabāti." });
        return;
      }

      showFeedback({ type: "error", text: result.error });
    });
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_386px] lg:items-start">
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm md:p-6">
          <SettingsSection title="Uzņēmums">
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
                label="Uzņēmuma nosaukums"
                id="companyName"
                value={settings.companyName}
                onChange={(value) => updateField("companyName", value)}
              />
            </div>
            <div className="sm:col-span-2">
              <FormField
                label="Adrese"
                id="address"
                value={settings.address}
                onChange={(value) => updateField("address", value)}
              />
            </div>
            <FormField
              label="Reģistrācijas numurs"
              id="registrationNumber"
              value={settings.registrationNumber}
              onChange={(value) => updateField("registrationNumber", value)}
            />
            <FormField
              label="PVN numurs"
              id="vatNumber"
              value={settings.vatNumber}
              placeholder="Nav obligāts"
              onChange={(value) => updateField("vatNumber", value)}
            />
          </SettingsSection>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm md:p-6">
          <SettingsSection title="Bankas rekvizīti">
            <div className="sm:col-span-2">
              <FormField
                label="Bankas konta numurs"
                id="bankAccountNumber"
                value={settings.bankAccountNumber}
                placeholder="LV… IBAN"
                onChange={updateBankAccountNumber}
              />
            </div>
            {settings.bankAccountNumber.trim() ? (
              <>
                <FormField
                  label="Bankas nosaukums"
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
          <SettingsSection title="Tāme">
            <label htmlFor="estimateValidityDays" className="block">
              <span className="mb-1.5 block text-sm font-medium text-zinc-700">
                Tāmes derīguma termiņš
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
                Darbinieka standarta stundas likme
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
          <SettingsSection title="Kontakti un valūta">
            <FormField
              label="Info telefons"
              id="phone"
              type="tel"
              value={settings.phone}
              onChange={(value) => updateField("phone", value)}
            />
            <FormField
              label="Info e-pasts"
              id="email"
              type="email"
              value={settings.email}
              onChange={(value) => updateField("email", value)}
            />
            <div className="sm:col-span-2">
              <label htmlFor="currency" className="block">
                <span className="mb-1.5 block text-sm font-medium text-zinc-700">
                  Valūta
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
          <button
            type="submit"
            disabled={isPending}
            className="rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? "Saglabā…" : "Saglabāt"}
          </button>
        </div>
      </form>

      <div className="lg:sticky lg:top-[4.5rem]">
        <CompanyPreview settings={settings} />
      </div>
    </div>
  );
}
