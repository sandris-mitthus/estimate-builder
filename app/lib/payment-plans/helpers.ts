import {
  type LocalizedValues,
} from "@/app/lib/i18n/localized-values";

export type { LocalizedValues } from "@/app/lib/i18n/localized-values";
export { resolveLocalizedValue } from "@/app/lib/i18n/localized-values";

export type PaymentPlanPrices = {
  priceMonth: number;
  priceQuarter: number;
  priceYear: number;
  earlyBirdPriceMonth: number;
  earlyBirdPriceQuarter: number;
  earlyBirdPriceYear: number;
};

export type PaymentPlanBillingPeriod = "month" | "quarter" | "year";

export type PaymentPlanSummary = {
  id: string;
  planKey: string;
  nameValues: LocalizedValues;
  descriptionValues: LocalizedValues;
  moduleKeys: string[];
  priceMonth: number;
  priceQuarter: number;
  priceYear: number;
  earlyBirdPriceMonth: number;
  earlyBirdPriceQuarter: number;
  earlyBirdPriceYear: number;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type PaymentPlanInput = {
  planKey: string;
  nameValues: LocalizedValues;
  descriptionValues: LocalizedValues;
  moduleKeys: string[];
  priceMonth: number | string;
  priceQuarter: number | string;
  priceYear: number | string;
  earlyBirdPriceMonth: number | string;
  earlyBirdPriceQuarter: number | string;
  earlyBirdPriceYear: number | string;
};

export type EarlyBirdSettings = {
  /** 0 disables Early Bird offers and new assignments. */
  limit: number;
};

export type EarlyBirdAvailability = EarlyBirdSettings & {
  claimed: number;
};

/** Parses a money input into a non-negative finite number, or null if invalid. */
export function parsePaymentPlanPrice(value: unknown): number | null {
  if (typeof value === "number") {
    if (!Number.isFinite(value) || value < 0) return null;
    return Math.round(value * 100) / 100;
  }

  const trimmed = String(value ?? "")
    .trim()
    .replace(/\s/g, "")
    .replace(",", ".");
  if (!trimmed) return null;

  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return Math.round(parsed * 100) / 100;
}

export function getPaymentPlanPriceForPeriod(
  plan: Pick<
    PaymentPlanSummary,
    | "priceMonth"
    | "priceQuarter"
    | "priceYear"
    | "earlyBirdPriceMonth"
    | "earlyBirdPriceQuarter"
    | "earlyBirdPriceYear"
  >,
  period: PaymentPlanBillingPeriod,
  options?: { earlyBird?: boolean },
): number {
  if (options?.earlyBird) {
    if (period === "quarter") return plan.earlyBirdPriceQuarter;
    if (period === "year") return plan.earlyBirdPriceYear;
    return plan.earlyBirdPriceMonth;
  }
  if (period === "quarter") return plan.priceQuarter;
  if (period === "year") return plan.priceYear;
  return plan.priceMonth;
}

const BILLING_PERIODS: PaymentPlanBillingPeriod[] = ["month", "quarter", "year"];

/** True when the plan offers this billing period (price > 0). */
export function paymentPlanHasPriceForPeriod(
  plan: Pick<
    PaymentPlanSummary,
    | "priceMonth"
    | "priceQuarter"
    | "priceYear"
    | "earlyBirdPriceMonth"
    | "earlyBirdPriceQuarter"
    | "earlyBirdPriceYear"
  >,
  period: PaymentPlanBillingPeriod,
  options?: { earlyBird?: boolean },
): boolean {
  if (getPaymentPlanPriceForPeriod(plan, period) > 0) {
    return true;
  }
  if (options?.earlyBird) {
    return getPaymentPlanPriceForPeriod(plan, period, { earlyBird: true }) > 0;
  }
  return false;
}

/**
 * Landing period tabs: only periods that at least one plan prices
 * (empty / 0 = not offered).
 */
export function listAvailablePaymentPlanBillingPeriods(
  plans: Array<
    Pick<
      PaymentPlanSummary,
      | "priceMonth"
      | "priceQuarter"
      | "priceYear"
      | "earlyBirdPriceMonth"
      | "earlyBirdPriceQuarter"
      | "earlyBirdPriceYear"
    >
  >,
  options?: { earlyBird?: boolean },
): PaymentPlanBillingPeriod[] {
  return BILLING_PERIODS.filter((period) =>
    plans.some((plan) => paymentPlanHasPriceForPeriod(plan, period, options)),
  );
}

/** True when the public Early Bird offer should still be shown (slots remain). */
export function isEarlyBirdOfferAvailable(
  availability: Pick<EarlyBirdAvailability, "limit" | "claimed">,
): boolean {
  return availability.limit > 0 && availability.claimed < availability.limit;
}

/** True when plan is paid, has until-date, and until-date is not past. */
export function isCompanyPaymentPlanActive(input: {
  paymentPlanId: string | null;
  paymentPlanUntil: string | null;
  paymentPlanPaid: boolean;
  todayIso?: string;
}): boolean {
  if (!input.paymentPlanId || !input.paymentPlanPaid) {
    return false;
  }
  const until = toDateInputValue(input.paymentPlanUntil);
  if (!until) {
    return false;
  }
  const today = input.todayIso ?? new Date().toISOString().slice(0, 10);
  return until >= today;
}

/** True when valid-until date is set and is before today. */
export function isCompanyPaymentPlanExpired(input: {
  paymentPlanUntil: string | null;
  todayIso?: string;
}): boolean {
  const until = toDateInputValue(input.paymentPlanUntil);
  if (!until) return false;
  const today = input.todayIso ?? new Date().toISOString().slice(0, 10);
  return until < today;
}

export type CompanyAccessLockReason = "expired" | "missing_until" | "blocked";

/**
 * Whole-app lock for non-admin company users when payment plans are on
 * and the plan has no until-date or is expired, or when access is manually blocked.
 */
export function getCompanyAccessLockReason(input: {
  paymentPlansEnabled: boolean;
  paymentPlanUntil: string | null;
  accessBlocked: boolean;
  isVip?: boolean;
  todayIso?: string;
}): CompanyAccessLockReason | null {
  // VIP companies bypass payment-plan and access-block locks; modules still apply.
  if (input.isVip) {
    return null;
  }
  if (input.accessBlocked) {
    return "blocked";
  }
  if (!input.paymentPlansEnabled) {
    return null;
  }
  const until = toDateInputValue(input.paymentPlanUntil);
  if (!until) {
    return "missing_until";
  }
  if (
    isCompanyPaymentPlanExpired({
      paymentPlanUntil: until,
      todayIso: input.todayIso,
    })
  ) {
    return "expired";
  }
  return null;
}

export type TrialSettings = {
  /** null disables the trial: new companies get no plan at all. */
  trialPlanId: string | null;
  trialDays: number;
};

export const MIN_TRIAL_DAYS = 1;
export const MAX_TRIAL_DAYS = 365;
export const DEFAULT_TRIAL_DAYS = 14;

/** YYYY-MM-DD that is `days` after today, used for trial valid-until dates. */
export function addDaysToTodayIso(days: number, todayIso?: string): string {
  const base = todayIso ?? new Date().toISOString().slice(0, 10);
  const date = new Date(`${base}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + Math.trunc(days));
  return date.toISOString().slice(0, 10);
}

/** Normalize DB date / ISO timestamp to YYYY-MM-DD for <input type="date">. */
export function toDateInputValue(value: string | null | undefined): string {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) return "";
  const match = trimmed.match(/^(\d{4}-\d{2}-\d{2})/);
  return match?.[1] ?? "";
}
