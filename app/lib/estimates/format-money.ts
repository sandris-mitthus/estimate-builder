import {
  addThousandSeparators,
  formatAmount,
  isAmountDisplayEmpty,
  roundToTwoDecimals,
} from "@/app/lib/estimates/calculate-line";
import { getCurrencySymbol } from "@/app/lib/settings/currencies";

export function formatMoney(value: number, currency?: string | null): string {
  return `${getCurrencySymbol(currency)} ${formatAmount(value)}`;
}

/** Tāmes kopsummām: 0 vai nederīgs → "—". */
export function formatMoneyDisplay(value: number, currency?: string | null): string {
  if (isAmountDisplayEmpty(value)) {
    return "—";
  }

  return `${getCurrencySymbol(currency)} ${addThousandSeparators(roundToTwoDecimals(value).toFixed(2))}`;
}
