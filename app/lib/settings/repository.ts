import { DEFAULT_COMPANY_SETTINGS } from "@/app/lib/settings/defaults";
import { getCurrentCompanyId } from "@/app/lib/companies/current-company";
import { resolveCompanyLogoDisplayUrl } from "@/app/lib/settings/logo-storage";
import { DEFAULT_CURRENCY, isCurrencyCode } from "@/app/lib/settings/currencies";
import { normalizeDefaultHourlyRate } from "@/app/lib/settings/default-hourly-rate";
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
    logoUrl: resolveCompanyLogoDisplayUrl(row.logo_url),
    estimateValidityDays: normalizeEstimateValidityDays(row.estimate_validity_days),
    defaultHourlyRate: normalizeDefaultHourlyRate(row.default_hourly_rate),
    offerAdditionalInfo: row.offer_additional_info ?? "",
    offerValidityDays: normalizeEstimateValidityDays(row.offer_validity_days),
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
    logo_url: sanitizeLogoUrl(settings.logoUrl),
    estimate_validity_days: normalizeEstimateValidityDays(
      settings.estimateValidityDays,
    ),
    default_hourly_rate: normalizeDefaultHourlyRate(settings.defaultHourlyRate),
    offer_additional_info: settings.offerAdditionalInfo.trim(),
    offer_validity_days: normalizeEstimateValidityDays(settings.offerValidityDays),
  };
}

function sanitizeLogoUrl(url: string): string {
  const trimmed = url.trim();
  if (trimmed === "") return "";
  if (trimmed.startsWith("/api/company/logo")) return trimmed;
  return "";
}

export async function getCompanySettings(): Promise<CompanySettings> {
  if (!isSupabaseAdminConfigured()) {
    return DEFAULT_COMPANY_SETTINGS;
  }

  const companyId = await getCurrentCompanyId();
  if (!companyId) {
    return DEFAULT_COMPANY_SETTINGS;
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("company_settings")
    .select(
      "id, company_id, company_name, address, registration_number, vat_number, bank_name, swift, bank_account_number, phone, email, currency, logo_url, estimate_validity_days, default_hourly_rate, offer_additional_info, offer_validity_days",
    )
    .eq("company_id", companyId)
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
  const companyId = await getCurrentCompanyId();
  if (!companyId) {
    return { ok: false, error: "Uzņēmums nav atrasts." };
  }

  const { error } = await supabase.from("company_settings").upsert({
    company_id: companyId,
    ...mapSettings(settings),
  }, {
    onConflict: "company_id",
  });

  if (error) {
    return { ok: false, error: "Neizdevās saglabāt iestatījumus." };
  }

  return { ok: true };
}
