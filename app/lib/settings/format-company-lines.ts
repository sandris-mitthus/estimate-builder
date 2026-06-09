import type { CompanySettings } from "@/app/lib/settings/types";

export type CompanyDisplayLine = {
  label?: string;
  value: string;
};

export function formatCompanyDisplayLines(
  settings: CompanySettings,
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
      label: "Reģ. nr.",
      value: settings.registrationNumber.trim(),
    });
  }

  if (settings.vatNumber.trim()) {
    lines.push({
      label: "PVN nr.",
      value: settings.vatNumber.trim(),
    });
  }

  if (settings.bankName.trim()) {
    lines.push({
      label: "Banka",
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
      label: "Konts",
      value: settings.bankAccountNumber.trim(),
    });
  }

  if (settings.phone.trim()) {
    lines.push({
      label: "Tālrunis",
      value: settings.phone.trim(),
    });
  }

  if (settings.email.trim()) {
    lines.push({
      label: "E-pasts",
      value: settings.email.trim(),
    });
  }

  return lines;
}
