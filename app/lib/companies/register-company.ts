import { getCurrentUser } from "@/app/lib/auth/get-current-user";
import { mapUserDisplay, resolveAvatarUrl } from "@/app/lib/auth/map-user-display";
import { getCurrentCompanyId } from "@/app/lib/companies/current-company";
import { DEFAULT_CURRENCY, isCurrencyCode } from "@/app/lib/settings/currencies";
import { normalizeDefaultHourlyRate } from "@/app/lib/settings/default-hourly-rate";
import { normalizeEstimateValidityDays } from "@/app/lib/settings/estimate-validity-days";
import type { CompanySettings } from "@/app/lib/settings/types";
import { listSiteUserGroups } from "@/app/lib/site-admin/repository";
import { createAdminClient } from "@/app/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/app/lib/supabase/env";
import { isSystemAdminUser } from "@/app/lib/users/system-admin-repository";
import { isValidEmail } from "@/app/lib/validation/contact-fields";

async function seedCompanyDefaultGroups(
  supabase: ReturnType<typeof createAdminClient>,
  companyId: string,
): Promise<string | null> {
  const defaultGroups = await listSiteUserGroups();
  let adminGroupId: string | null = null;

  for (const group of defaultGroups) {
    const { data: existing } = await supabase
      .from("company_user_groups")
      .select("id")
      .eq("company_id", companyId)
      .eq("slug", group.slug)
      .maybeSingle();

    if (existing && typeof existing.id === "string") {
      if (group.slug === "admin") {
        adminGroupId = existing.id;
      }
      continue;
    }

    const { data: inserted, error } = await supabase
      .from("company_user_groups")
      .insert({
        company_id: companyId,
        slug: group.slug,
        name: group.name,
        permissions: group.permissions,
        is_system: true,
      })
      .select("id")
      .single();

    if (error || !inserted) {
      continue;
    }

    if (group.slug === "admin") {
      adminGroupId = inserted.id as string;
    }
  }

  return adminGroupId;
}

export async function registerCompanyForCurrentUser(
  settings: CompanySettings,
): Promise<
  | { ok: true; companyId: string }
  | { ok: false; error: string }
> {
  if (!isSupabaseAdminConfigured()) {
    return { ok: false, error: "Datubāze nav konfigurēta." };
  }

  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, error: "Nav autorizācijas." };
  }

  if (await isSystemAdminUser(user)) {
    return {
      ok: false,
      error: "Sistēmas administrators uzņēmumu šeit neveido.",
    };
  }

  const existingCompanyId = await getCurrentCompanyId();
  if (existingCompanyId) {
    return { ok: false, error: "Tu jau esi piesaistīts uzņēmumam." };
  }

  const companyName = settings.companyName.trim();
  const email = settings.email.trim();
  const estimateValidityDays = normalizeEstimateValidityDays(
    settings.estimateValidityDays,
  );

  if (!companyName) {
    return { ok: false, error: "Ievadi uzņēmuma nosaukumu." };
  }

  if (companyName.length > 200) {
    return { ok: false, error: "Uzņēmuma nosaukums ir pārāk garš." };
  }

  if (email && !isValidEmail(email)) {
    return { ok: false, error: "Ievadi derīgu e-pasta adresi." };
  }

  if (estimateValidityDays < 1) {
    return { ok: false, error: "Ievadi tāmes derīguma termiņu dienās." };
  }

  const supabase = createAdminClient();
  const profile = mapUserDisplay(user);

  const { error: userUpsertError } = await supabase.from("users").upsert(
    {
      id: user.id,
      email: user.email ?? "",
      name: profile.name,
      avatar_url: resolveAvatarUrl(user) ?? "",
      is_admin: false,
    },
    { onConflict: "id" },
  );

  if (userUpsertError) {
    return { ok: false, error: "Neizdevās saglabāt lietotāja profilu." };
  }

  const { data: company, error: companyError } = await supabase
    .from("companies")
    .insert({ name: companyName })
    .select("id")
    .single();

  if (companyError || !company?.id) {
    return { ok: false, error: "Neizdevās izveidot uzņēmumu." };
  }

  const companyId = company.id as string;
  const currency = isCurrencyCode(settings.currency)
    ? settings.currency
    : DEFAULT_CURRENCY;

  const { error: settingsError } = await supabase.from("company_settings").insert({
    company_id: companyId,
    company_name: companyName,
    address: settings.address.trim(),
    registration_number: settings.registrationNumber.trim(),
    vat_number: settings.vatNumber.trim(),
    bank_name: settings.bankName.trim(),
    swift: settings.swift.trim(),
    bank_account_number: settings.bankAccountNumber.trim(),
    phone: settings.phone.trim(),
    email,
    currency,
    logo_url: "",
    estimate_validity_days: estimateValidityDays,
    default_hourly_rate: normalizeDefaultHourlyRate(settings.defaultHourlyRate),
    offer_additional_info: settings.offerAdditionalInfo.trim(),
    offer_validity_days: estimateValidityDays,
  });

  if (settingsError) {
    await supabase.from("companies").delete().eq("id", companyId);
    return { ok: false, error: "Neizdevās saglabāt uzņēmuma iestatījumus." };
  }

  const { error: membershipError } = await supabase.from("company_users").insert({
    company_id: companyId,
    user_id: user.id,
    role: "owner",
    status: "active",
  });

  if (membershipError) {
    await supabase.from("companies").delete().eq("id", companyId);
    return { ok: false, error: "Neizdevās piesaistīt lietotāju uzņēmumam." };
  }

  const adminGroupId = await seedCompanyDefaultGroups(supabase, companyId);
  if (adminGroupId) {
    await supabase.from("company_group_members").upsert(
      {
        company_id: companyId,
        user_id: user.id,
        group_id: adminGroupId,
      },
      { onConflict: "company_id,user_id" },
    );
  }

  return { ok: true, companyId };
}
