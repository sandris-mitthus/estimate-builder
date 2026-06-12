import {
  addThousandSeparators,
  formatAmount,
  isAmountDisplayEmpty,
  roundToTwoDecimals,
} from "@/app/lib/estimates/calculate-line";

export function formatMoney(value: number): string {
  return `€ ${formatAmount(value)}`;
}

/** Tāmes kopsummām: 0 vai nederīgs → "—". */
export function formatMoneyDisplay(value: number): string {
  if (isAmountDisplayEmpty(value)) {
    return "—";
  }

  return `€ ${addThousandSeparators(roundToTwoDecimals(value).toFixed(2))}`;
}
