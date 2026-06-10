import { DEFAULT_COMPANY_SETTINGS } from "@/app/lib/settings/defaults";
import { DEFAULT_CURRENCY, isCurrencyCode } from "@/app/lib/settings/currencies";
import {
  DEFAULT_ESTIMATE_VALIDITY_DAYS,
  normalizeEstimateValidityDays,
} from "@/app/lib/settings/estimate-validity-days";
import type {
  CompanySettings,
  CompanySettingsRow,
} from "@/app/lib/settings/types";
import { createAdminClient } from "@/app/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/app/lib/supabase/env";

function mapRow(row: CompanySettingsRow): CompanySettings {
  return {
    companyName: row.company_name,
    address: row.address,
    registrationNumber: row.registration_number,
    vatNumber: row.vat_number,
    bankName: row.bank_name,
    swift: row.swift,
    bankAccountNumber: row.bank_account_number,
    phone: row.phone,
    email: row.email,
    currency: isCurrencyCode(row.currency) ? row.currency : DEFAULT_CURRENCY,
    logoUrl: row.logo_url,
    estimateValidityDays: normalizeEstimateValidityDays(row.estimate_validity_days),
  };
}

function mapSettings(settings: CompanySettings): Omit<CompanySettingsRow, "id"> {
  return {
    company_name: settings.companyName.trim(),
    address: settings.address.trim(),
    registration_number: settings.registrationNumber.trim(),
    vat_number: settings.vatNumber.trim(),
    bank_name: settings.bankName.trim(),
    swift: settings.swift.trim(),
    bank_account_number: settings.bankAccountNumber.trim(),
    phone: settings.phone.trim(),
    email: settings.email.trim(),
    currency: isCurrencyCode(settings.currency)
      ? settings.currency
      : DEFAULT_CURRENCY,
    logo_url: settings.logoUrl.trim(),
    estimate_validity_days: normalizeEstimateValidityDays(
      settings.estimateValidityDays,
    ),
  };
}

export async function getCompanySettings(): Promise<CompanySettings> {
  if (!isSupabaseAdminConfigured()) {
    return DEFAULT_COMPANY_SETTINGS;
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("company_settings")
    .select(
      "id, company_name, address, registration_number, vat_number, bank_name, swift, bank_account_number, phone, email, currency, logo_url, estimate_validity_days",
    )
    .eq("id", 1)
    .maybeSingle();

  if (error || !data) {
    return DEFAULT_COMPANY_SETTINGS;
  }

  return mapRow(data as CompanySettingsRow);
}

export async function saveCompanySettings(
  settings: CompanySettings,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!isSupabaseAdminConfigured()) {
    return {
      ok: false,
      error: "Datubāze nav konfigurēta. Pievieno SUPABASE_SERVICE_ROLE_KEY.",
    };
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("company_settings").upsert({
    id: 1,
    ...mapSettings(settings),
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true };
}
