import { getCompanyPaymentAccessRow } from "@/app/lib/companies/payment-access";
import {
  normalizeLocalizedValues,
  parseLocalizedValues,
} from "@/app/lib/i18n/localized-values";
import { listSiteLanguages } from "@/app/lib/site-admin/repository";
import { listFrontendModules } from "@/app/lib/frontend-modules/repository";
import { createAdminClient } from "@/app/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/app/lib/supabase/env";
import { cache } from "react";
import {
  DEFAULT_TRIAL_DAYS,
  MAX_TRIAL_DAYS,
  MIN_TRIAL_DAYS,
  getCompanyAccessLockReason,
  parsePaymentPlanPrice,
  type CompanyAccessLockReason,
  type EarlyBirdAvailability,
  type EarlyBirdSettings,
  type LocalizedValues,
  type PaymentPlanInput,
  type PaymentPlanSummary,
  type TrialSettings,
} from "@/app/lib/payment-plans/helpers";

export type {
  EarlyBirdAvailability,
  EarlyBirdSettings,
  LocalizedValues,
  PaymentPlanBillingPeriod,
  PaymentPlanInput,
  PaymentPlanPrices,
  PaymentPlanSummary,
  TrialSettings,
} from "@/app/lib/payment-plans/helpers";
export {
  DEFAULT_TRIAL_DAYS,
  MAX_TRIAL_DAYS,
  MIN_TRIAL_DAYS,
  addDaysToTodayIso,
  getCompanyAccessLockReason,
  getPaymentPlanPriceForPeriod,
  isCompanyPaymentPlanActive,
  isCompanyPaymentPlanExpired,
  isEarlyBirdOfferAvailable,
  parsePaymentPlanPrice,
  resolveLocalizedValue,
  toDateInputValue,
} from "@/app/lib/payment-plans/helpers";
export type { CompanyAccessLockReason } from "@/app/lib/payment-plans/helpers";

type PaymentPlanRow = {
  id: string;
  plan_key: string;
  name_values: unknown;
  description_values: unknown;
  price_month: number | string | null;
  price_quarter: number | string | null;
  price_year: number | string | null;
  early_bird_price_month: number | string | null;
  early_bird_price_quarter: number | string | null;
  early_bird_price_year: number | string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

type PlanModuleRow = {
  plan_id: string;
  module_key: string;
};

const PLAN_KEY_PATTERN = /^[a-z0-9._:-]+$/;

function normalizePlanKey(value: string): string {
  return value.trim().toLowerCase();
}

function validatePlanKey(planKey: string): string | null {
  if (!planKey) {
    return "Ievadi plāna atslēgu.";
  }
  if (planKey.length > 64 || !PLAN_KEY_PATTERN.test(planKey)) {
    return "Atslēgai jābūt formātā ar mazajiem burtiem, cipariem, punktiem, svītrām, apakšsvītrām un kolu.";
  }
  return null;
}

export async function isPaymentPlansEnabled(): Promise<boolean> {
  if (!isSupabaseAdminConfigured()) {
    return false;
  }
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("site_settings")
    .select("payment_plans_enabled")
    .eq("id", 1)
    .maybeSingle();
  if (error || !data) {
    return false;
  }
  return data.payment_plans_enabled === true;
}

export const getPaymentPlansEnabledCached = cache(isPaymentPlansEnabled);

export async function setPaymentPlansEnabled(
  enabled: boolean,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!isSupabaseAdminConfigured()) {
    return { ok: false, error: "Datubāze nav konfigurēta." };
  }
  const supabase = createAdminClient();
  const { error } = await supabase.from("site_settings").upsert(
    { id: 1, payment_plans_enabled: enabled === true },
    { onConflict: "id" },
  );
  if (error) {
    return { ok: false, error: "Neizdevās saglabāt maksas plānu iestatījumu." };
  }
  return { ok: true };
}

function normalizeTrialDays(value: unknown): number {
  const parsed =
    typeof value === "number" ? value : Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(parsed)) {
    return DEFAULT_TRIAL_DAYS;
  }
  return Math.min(MAX_TRIAL_DAYS, Math.max(MIN_TRIAL_DAYS, Math.trunc(parsed)));
}

export const getTrialSettings = cache(async (): Promise<TrialSettings> => {
  if (!isSupabaseAdminConfigured()) {
    return { trialPlanId: null, trialDays: DEFAULT_TRIAL_DAYS };
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("site_settings")
    .select("trial_plan_id, trial_days")
    .eq("id", 1)
    .maybeSingle();

  if (error || !data) {
    return { trialPlanId: null, trialDays: DEFAULT_TRIAL_DAYS };
  }

  return {
    trialPlanId:
      typeof data.trial_plan_id === "string" && data.trial_plan_id.trim()
        ? data.trial_plan_id
        : null,
    trialDays: normalizeTrialDays(data.trial_days),
  };
});

export async function saveTrialSettings(
  input: TrialSettings,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!isSupabaseAdminConfigured()) {
    return { ok: false, error: "Datubāze nav konfigurēta." };
  }

  const planId = input.trialPlanId?.trim() || null;
  const rawDays =
    typeof input.trialDays === "number"
      ? input.trialDays
      : Number.parseInt(String(input.trialDays ?? ""), 10);

  // The length only matters while a trial plan is selected; without one it is
  // just a stored preference, so keep it usable instead of failing the save.
  const daysInvalid =
    !Number.isFinite(rawDays) ||
    !Number.isInteger(rawDays) ||
    rawDays < MIN_TRIAL_DAYS ||
    rawDays > MAX_TRIAL_DAYS;

  if (planId && daysInvalid) {
    return {
      ok: false,
      error: "Ievadi izmēģinājuma dienu skaitu no 1 līdz 365.",
    };
  }

  const days = daysInvalid ? normalizeTrialDays(rawDays) : rawDays;

  if (planId) {
    const plans = await listPaymentPlans();
    if (!plans.some((plan) => plan.id === planId)) {
      return { ok: false, error: "Maksas plāns nav atrasts." };
    }
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("site_settings").upsert(
    { id: 1, trial_plan_id: planId, trial_days: days },
    { onConflict: "id" },
  );

  if (error) {
    return {
      ok: false,
      error: "Neizdevās saglabāt izmēģinājuma iestatījumus.",
    };
  }

  return { ok: true };
}

export async function countEarlyBirdCompanies(): Promise<number> {
  if (!isSupabaseAdminConfigured()) {
    return 0;
  }
  const supabase = createAdminClient();
  const { count, error } = await supabase
    .from("companies")
    .select("id", { count: "exact", head: true })
    .eq("payment_plan_is_early_bird", true);
  if (error || count == null) {
    return 0;
  }
  return count;
}

export const getEarlyBirdSettings = cache(
  async (): Promise<EarlyBirdAvailability> => {
    if (!isSupabaseAdminConfigured()) {
      return { limit: 0, claimed: 0 };
    }

    const supabase = createAdminClient();
    const [{ data, error }, claimed] = await Promise.all([
      supabase
        .from("site_settings")
        .select("early_bird_limit")
        .eq("id", 1)
        .maybeSingle(),
      countEarlyBirdCompanies(),
    ]);

    if (error || !data) {
      return { limit: 0, claimed };
    }

    const raw = data.early_bird_limit;
    const parsed =
      typeof raw === "number" ? raw : Number.parseInt(String(raw ?? ""), 10);
    const limit =
      Number.isFinite(parsed) && parsed >= 0 ? Math.trunc(parsed) : 0;

    return { limit, claimed };
  },
);

export async function saveEarlyBirdSettings(
  input: EarlyBirdSettings,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!isSupabaseAdminConfigured()) {
    return { ok: false, error: "Datubāze nav konfigurēta." };
  }

  const raw =
    typeof input.limit === "number"
      ? input.limit
      : Number.parseInt(String(input.limit ?? ""), 10);

  if (!Number.isFinite(raw) || !Number.isInteger(raw) || raw < 0) {
    return {
      ok: false,
      error: "Ievadi derīgu Early Bird slotu skaitu (0 vai vairāk).",
    };
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("site_settings").upsert(
    { id: 1, early_bird_limit: raw },
    { onConflict: "id" },
  );

  if (error) {
    return {
      ok: false,
      error: "Neizdevās saglabāt Early Bird limītu.",
    };
  }

  return { ok: true };
}

function mapPaymentPlanRow(
  row: PaymentPlanRow,
  moduleKeys: string[],
): PaymentPlanSummary {
  return {
    id: row.id,
    planKey: row.plan_key,
    nameValues: parseLocalizedValues(row.name_values),
    descriptionValues: parseLocalizedValues(row.description_values),
    moduleKeys,
    priceMonth: parsePaymentPlanPrice(row.price_month) ?? 0,
    priceQuarter: parsePaymentPlanPrice(row.price_quarter) ?? 0,
    priceYear: parsePaymentPlanPrice(row.price_year) ?? 0,
    earlyBirdPriceMonth: parsePaymentPlanPrice(row.early_bird_price_month) ?? 0,
    earlyBirdPriceQuarter:
      parsePaymentPlanPrice(row.early_bird_price_quarter) ?? 0,
    earlyBirdPriceYear: parsePaymentPlanPrice(row.early_bird_price_year) ?? 0,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function normalizePlanPrices(input: PaymentPlanInput): {
  ok: true;
  prices: {
    price_month: number;
    price_quarter: number;
    price_year: number;
    early_bird_price_month: number;
    early_bird_price_quarter: number;
    early_bird_price_year: number;
  };
} | { ok: false; error: string } {
  const priceMonth = parsePaymentPlanPrice(input.priceMonth);
  const priceQuarter = parsePaymentPlanPrice(input.priceQuarter);
  const priceYear = parsePaymentPlanPrice(input.priceYear);
  const earlyBirdPriceMonth = parsePaymentPlanPrice(input.earlyBirdPriceMonth);
  const earlyBirdPriceQuarter = parsePaymentPlanPrice(
    input.earlyBirdPriceQuarter,
  );
  const earlyBirdPriceYear = parsePaymentPlanPrice(input.earlyBirdPriceYear);

  if (
    priceMonth === null ||
    priceQuarter === null ||
    priceYear === null ||
    earlyBirdPriceMonth === null ||
    earlyBirdPriceQuarter === null ||
    earlyBirdPriceYear === null
  ) {
    return {
      ok: false,
      error: "Ievadi derīgu cenu (0 vai vairāk) katram periodam.",
    };
  }

  return {
    ok: true,
    prices: {
      price_month: priceMonth,
      price_quarter: priceQuarter,
      price_year: priceYear,
      early_bird_price_month: earlyBirdPriceMonth,
      early_bird_price_quarter: earlyBirdPriceQuarter,
      early_bird_price_year: earlyBirdPriceYear,
    },
  };
}

const PLAN_SELECT =
  "id, plan_key, name_values, description_values, price_month, price_quarter, price_year, early_bird_price_month, early_bird_price_quarter, early_bird_price_year, sort_order, created_at, updated_at";

async function listPlanModuleRows(): Promise<PlanModuleRow[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("site_payment_plan_modules")
    .select("plan_id, module_key");
  if (error || !data) {
    return [];
  }
  return data as PlanModuleRow[];
}

export async function listPaymentPlans(): Promise<PaymentPlanSummary[]> {
  if (!isSupabaseAdminConfigured()) {
    return [];
  }

  const supabase = createAdminClient();
  const [{ data, error }, moduleRows] = await Promise.all([
    supabase
      .from("site_payment_plans")
      .select(PLAN_SELECT)
      .order("sort_order", { ascending: true })
      .order("plan_key", { ascending: true }),
    listPlanModuleRows(),
  ]);

  if (error || !data) {
    return [];
  }

  const modulesByPlan = new Map<string, string[]>();
  for (const row of moduleRows) {
    const list = modulesByPlan.get(row.plan_id) ?? [];
    list.push(row.module_key);
    modulesByPlan.set(row.plan_id, list);
  }

  return (data as PaymentPlanRow[]).map((row) =>
    mapPaymentPlanRow(row, (modulesByPlan.get(row.id) ?? []).sort()),
  );
}

export const getPaymentPlanModuleKeys = cache(
  async (planId: string): Promise<Set<string>> => {
    if (!planId.trim() || !isSupabaseAdminConfigured()) {
      return new Set();
    }
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("site_payment_plan_modules")
      .select("module_key")
      .eq("plan_id", planId.trim());
    if (error || !data) {
      return new Set();
    }
    return new Set(
      data
        .map((row) =>
          typeof row.module_key === "string" ? row.module_key : "",
        )
        .filter(Boolean),
    );
  },
);

async function replacePlanModules(
  planId: string,
  moduleKeys: string[],
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = createAdminClient();
  const { error: deleteError } = await supabase
    .from("site_payment_plan_modules")
    .delete()
    .eq("plan_id", planId);
  if (deleteError) {
    return { ok: false, error: "Neizdevās saglabāt plāna moduļus." };
  }

  const uniqueKeys = [...new Set(moduleKeys.map((key) => key.trim()).filter(Boolean))];
  if (uniqueKeys.length === 0) {
    return { ok: true };
  }

  const { error: insertError } = await supabase
    .from("site_payment_plan_modules")
    .insert(
      uniqueKeys.map((module_key) => ({
        plan_id: planId,
        module_key,
      })),
    );
  if (insertError) {
    return { ok: false, error: "Neizdevās saglabāt plāna moduļus." };
  }
  return { ok: true };
}

export async function createPaymentPlan(
  input: PaymentPlanInput,
): Promise<{ ok: true; plan: PaymentPlanSummary } | { ok: false; error: string }> {
  const planKey = normalizePlanKey(input.planKey);
  const keyError = validatePlanKey(planKey);
  if (keyError) {
    return { ok: false, error: keyError };
  }

  const nameValues = normalizeLocalizedValues(input.nameValues);
  if (!Object.values(nameValues).some((value) => value.trim())) {
    return { ok: false, error: "Ievadi plāna nosaukumu vismaz vienā valodā." };
  }

  const pricesResult = normalizePlanPrices(input);
  if (!pricesResult.ok) {
    return pricesResult;
  }

  if (!isSupabaseAdminConfigured()) {
    return { ok: false, error: "Datubāze nav konfigurēta." };
  }

  const existing = await listPaymentPlans();
  const nextSortOrder =
    Math.max(0, ...existing.map((plan) => plan.sortOrder)) + 10;

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("site_payment_plans")
    .insert({
      plan_key: planKey,
      name_values: nameValues,
      description_values: normalizeLocalizedValues(input.descriptionValues),
      sort_order: nextSortOrder,
      ...pricesResult.prices,
    })
    .select(PLAN_SELECT)
    .single();

  if (error || !data) {
    const message = error?.message?.toLowerCase() ?? "";
    return {
      ok: false,
      error:
        message.includes("duplicate") || message.includes("unique")
          ? "Plāns ar šo atslēgu jau eksistē."
          : "Neizdevās izveidot maksas plānu.",
    };
  }

  const modulesResult = await replacePlanModules(data.id, input.moduleKeys);
  if (!modulesResult.ok) {
    await supabase.from("site_payment_plans").delete().eq("id", data.id);
    return modulesResult;
  }

  const plan = (await listPaymentPlans()).find((item) => item.id === data.id);
  if (!plan) {
    return { ok: false, error: "Neizdevās izveidot maksas plānu." };
  }
  return { ok: true, plan };
}

export async function updatePaymentPlan(
  planId: string,
  input: PaymentPlanInput,
): Promise<{ ok: true; plan: PaymentPlanSummary } | { ok: false; error: string }> {
  const trimmedId = planId.trim();
  if (!trimmedId) {
    return { ok: false, error: "Plāns nav norādīts." };
  }

  const planKey = normalizePlanKey(input.planKey);
  const keyError = validatePlanKey(planKey);
  if (keyError) {
    return { ok: false, error: keyError };
  }

  const nameValues = normalizeLocalizedValues(input.nameValues);
  if (!Object.values(nameValues).some((value) => value.trim())) {
    return { ok: false, error: "Ievadi plāna nosaukumu vismaz vienā valodā." };
  }

  const pricesResult = normalizePlanPrices(input);
  if (!pricesResult.ok) {
    return pricesResult;
  }

  if (!isSupabaseAdminConfigured()) {
    return { ok: false, error: "Datubāze nav konfigurēta." };
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("site_payment_plans")
    .update({
      plan_key: planKey,
      name_values: nameValues,
      description_values: normalizeLocalizedValues(input.descriptionValues),
      ...pricesResult.prices,
    })
    .eq("id", trimmedId);

  if (error) {
    const message = error.message.toLowerCase();
    return {
      ok: false,
      error:
        message.includes("duplicate") || message.includes("unique")
          ? "Plāns ar šo atslēgu jau eksistē."
          : "Neizdevās saglabāt maksas plānu.",
    };
  }

  const modulesResult = await replacePlanModules(trimmedId, input.moduleKeys);
  if (!modulesResult.ok) {
    return modulesResult;
  }

  const plan = (await listPaymentPlans()).find((item) => item.id === trimmedId);
  if (!plan) {
    return { ok: false, error: "Neizdevās saglabāt maksas plānu." };
  }
  return { ok: true, plan };
}

export async function deletePaymentPlan(
  planId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const trimmedId = planId.trim();
  if (!trimmedId) {
    return { ok: false, error: "Plāns nav norādīts." };
  }
  if (!isSupabaseAdminConfigured()) {
    return { ok: false, error: "Datubāze nav konfigurēta." };
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("site_payment_plans")
    .delete()
    .eq("id", trimmedId)
    .select("id");

  if (error) {
    return { ok: false, error: "Neizdevās dzēst maksas plānu." };
  }
  if (!data || data.length === 0) {
    return { ok: false, error: "Maksas plāns nav atrasts." };
  }
  return { ok: true };
}

export type CompanyPaymentPlanAssignment = {
  paymentPlanId: string | null;
  paymentPlanUntil: string | null;
  paymentPlanPaid: boolean;
  paymentPlanIsEarlyBird: boolean;
  accessBlocked: boolean;
};

export async function updateCompanyPaymentPlan(
  companyId: string,
  input: CompanyPaymentPlanAssignment,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const trimmedCompanyId = companyId.trim();
  if (!trimmedCompanyId) {
    return { ok: false, error: "Uzņēmums nav norādīts." };
  }
  if (!isSupabaseAdminConfigured()) {
    return { ok: false, error: "Datubāze nav konfigurēta." };
  }

  const planId = input.paymentPlanId?.trim() || null;
  const until = input.paymentPlanUntil?.trim() || null;
  if (until && !/^\d{4}-\d{2}-\d{2}$/.test(until)) {
    return { ok: false, error: "Ievadi derīgu datumu (YYYY-MM-DD)." };
  }

  if (planId) {
    const plans = await listPaymentPlans();
    if (!plans.some((plan) => plan.id === planId)) {
      return { ok: false, error: "Maksas plāns nav atrasts." };
    }
  }

  const supabase = createAdminClient();
  const wantEarlyBird = input.paymentPlanIsEarlyBird === true;

  if (wantEarlyBird) {
    const { data: currentRow, error: currentError } = await supabase
      .from("companies")
      .select("payment_plan_is_early_bird")
      .eq("id", trimmedCompanyId)
      .maybeSingle();

    if (currentError || !currentRow) {
      return { ok: false, error: "Uzņēmums nav atrasts." };
    }

    const alreadyEarlyBird = currentRow.payment_plan_is_early_bird === true;
    if (!alreadyEarlyBird) {
      const availability = await getEarlyBirdSettings();
      if (
        availability.limit <= 0 ||
        availability.claimed >= availability.limit
      ) {
        return {
          ok: false,
          error:
            "Early Bird sloti ir izsmelti vai Early Bird nav ieslēgts.",
        };
      }
    }
  }

  const { error } = await supabase
    .from("companies")
    .update({
      payment_plan_id: planId,
      payment_plan_until: until,
      payment_plan_paid: input.paymentPlanPaid === true,
      access_blocked: input.accessBlocked === true,
      payment_plan_is_early_bird: wantEarlyBird,
      // An explicit admin decision replaces the signup trial.
      payment_plan_is_trial: false,
    })
    .eq("id", trimmedCompanyId);

  if (error) {
    return { ok: false, error: "Neizdevās saglabāt uzņēmuma maksas plānu." };
  }
  return { ok: true };
}

export async function updateCompanyVip(
  companyId: string,
  isVip: boolean,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const trimmedCompanyId = companyId.trim();
  if (!trimmedCompanyId) {
    return { ok: false, error: "Uzņēmums nav norādīts." };
  }
  if (!isSupabaseAdminConfigured()) {
    return { ok: false, error: "Datubāze nav konfigurēta." };
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("companies")
    .update({ is_vip: isVip === true })
    .eq("id", trimmedCompanyId);

  if (error) {
    return { ok: false, error: "Neizdevās saglabāt VIP statusu." };
  }
  return { ok: true };
}

export async function getCompanyAccessLockReasonForCompany(
  companyId: string,
): Promise<CompanyAccessLockReason | null> {
  const trimmed = companyId.trim();
  if (!trimmed || !isSupabaseAdminConfigured()) {
    return null;
  }

  const [enabled, data] = await Promise.all([
    getPaymentPlansEnabledCached(),
    getCompanyPaymentAccessRow(trimmed),
  ]);

  if (!data) {
    return null;
  }

  return getCompanyAccessLockReason({
    paymentPlansEnabled: enabled,
    paymentPlanUntil:
      typeof data.payment_plan_until === "string"
        ? data.payment_plan_until.slice(0, 10)
        : null,
    accessBlocked: data.access_blocked === true,
    isVip: data.is_vip === true,
  });
}

export async function emptyLocalizedValues(): Promise<LocalizedValues> {
  const languages = await listSiteLanguages();
  return Object.fromEntries(languages.map((language) => [language.code, ""]));
}

export async function listGloballyEnabledModuleKeys(): Promise<string[]> {
  const modules = await listFrontendModules();
  return modules
    .filter((module) => module.isEnabled)
    .map((module) => module.moduleKey);
}
