import {
  type LocalizedValues,
} from "@/app/lib/i18n/localized-values";

export type { LocalizedValues } from "@/app/lib/i18n/localized-values";
export { resolveLocalizedValue } from "@/app/lib/i18n/localized-values";

export type PaymentPlanSummary = {
  id: string;
  planKey: string;
  nameValues: LocalizedValues;
  descriptionValues: LocalizedValues;
  moduleKeys: string[];
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type PaymentPlanInput = {
  planKey: string;
  nameValues: LocalizedValues;
  descriptionValues: LocalizedValues;
  moduleKeys: string[];
};

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
