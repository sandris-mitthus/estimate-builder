import {
  addThousandSeparators,
  roundToTwoDecimals,
} from "@/app/lib/estimates/calculate-line";
import { formatMoney } from "@/app/lib/estimates/format-money";
import { getCurrencySymbol } from "@/app/lib/settings/currencies";

export function normalizeAttentionBudget(
  value: number | null | undefined,
): number | undefined {
  if (value == null || !Number.isFinite(value) || value <= 0) {
    return undefined;
  }

  return roundToTwoDecimals(value);
}

/**
 * Aptuvenā budžeta summa, kas aizstāj rindas aprēķināto cenu kopsummās.
 * Atgriež `0`, ja rindai nav uzmanības karodziņa vai budžets nav norādīts.
 */
export function resolveAttentionBudgetAmount(
  row:
    | { requiresAttention?: boolean; attentionBudget?: number }
    | null
    | undefined,
): number {
  if (!row || row.requiresAttention !== true) {
    return 0;
  }

  return normalizeAttentionBudget(row.attentionBudget) ?? 0;
}

export function parseAttentionBudgetInput(value: string): number | undefined {
  const normalized = value.trim().replace(/\s/g, "").replace(",", ".");
  if (!normalized) {
    return undefined;
  }

  const parsed = Number.parseFloat(normalized);
  return normalizeAttentionBudget(parsed);
}

export function formatAttentionBudgetInputValue(
  value: number | undefined,
): string {
  const normalized = normalizeAttentionBudget(value);
  if (normalized == null) {
    return "";
  }

  return addThousandSeparators(normalized.toFixed(2));
}

export function formatAttentionBudgetDisplay(
  value: number | undefined,
  currency?: string | null,
): string | null {
  const normalized = normalizeAttentionBudget(value);
  if (normalized == null) {
    return null;
  }

  return formatMoney(normalized, currency);
}

export function getAttentionBudgetCurrencySuffix(
  currency?: string | null,
): string {
  return getCurrencySymbol(currency);
}

export function patchRequiresAttention<T extends {
  requiresAttention?: boolean;
  attentionBudget?: number;
}>(item: T, requiresAttention: boolean): T {
  return {
    ...item,
    requiresAttention: requiresAttention ? true : undefined,
    attentionBudget: requiresAttention ? item.attentionBudget : undefined,
  };
}
