import type { CompanySettings } from "@/app/lib/settings/types";
import type { TranslationParams } from "@/app/lib/i18n/translations";

type Translate = (
  key: string,
  fallback?: string,
  params?: TranslationParams,
) => string;

export type CompanyDisplayLine = {
  label?: string;
  value: string;
};

export function formatCompanyDisplayLines(
  settings: CompanySettings,
  t?: Translate,
): CompanyDisplayLine[] {
  const lines: CompanyDisplayLine[] = [];

  if (settings.companyName.trim()) {
    lines.push({ value: settings.companyName.trim() });
  }

  if (settings.address.trim()) {
    lines.push({ value: settings.address.trim() });
  }

  if (settings.registrationNumber.trim()) {
    lines.push({
      label: t ? t("settings.company_display.registration_number", "Reģ. nr.") : "Reģ. nr.",
      value: settings.registrationNumber.trim(),
    });
  }

  if (settings.vatNumber.trim()) {
    lines.push({
      label: t ? t("settings.company_display.vat_number", "PVN nr.") : "PVN nr.",
      value: settings.vatNumber.trim(),
    });
  }

  if (settings.bankName.trim()) {
    lines.push({
      label: t ? t("settings.company_display.bank", "Banka") : "Banka",
      value: settings.bankName.trim(),
    });
  }

  if (settings.swift.trim()) {
    lines.push({
      label: "SWIFT",
      value: settings.swift.trim(),
    });
  }

  if (settings.bankAccountNumber.trim()) {
    lines.push({
      label: t ? t("settings.company_display.account", "Konts") : "Konts",
      value: settings.bankAccountNumber.trim(),
    });
  }

  if (settings.phone.trim()) {
    lines.push({
      label: t ? t("settings.company_display.phone", "Tālrunis") : "Tālrunis",
      value: settings.phone.trim(),
    });
  }

  if (settings.email.trim()) {
    lines.push({
      label: t ? t("settings.company_display.email", "E-pasts") : "E-pasts",
      value: settings.email.trim(),
    });
  }

  return lines;
}
