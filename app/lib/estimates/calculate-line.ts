import type { PriceBreakdown } from "@/app/lib/estimates/types";

export function sumBreakdown(values: PriceBreakdown): number {
  return values.labor + values.materials + values.mechanisms;
}

export function multiplyBreakdown(
  quantity: number,
  unitPrice: PriceBreakdown,
): PriceBreakdown {
  const roundedQuantity = roundToTwoDecimals(quantity);

  return {
    labor: roundToTwoDecimals(roundedQuantity * unitPrice.labor),
    materials: roundToTwoDecimals(roundedQuantity * unitPrice.materials),
    mechanisms: roundToTwoDecimals(roundedQuantity * unitPrice.mechanisms),
  };
}

export function roundToTwoDecimals(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.round(value * 100) / 100;
}

export function formatAmount(value: number): string {
  if (!Number.isFinite(value)) return "0.00";
  return roundToTwoDecimals(value).toFixed(2);
}

export function isAmountDisplayEmpty(value: number): boolean {
  return !Number.isFinite(value) || value === 0;
}

/** Tāmes tabulu šūnām: 0 vai nederīgs → "—". */
export function formatAmountDisplay(value: number): string {
  if (isAmountDisplayEmpty(value)) {
    return "—";
  }

  return roundToTwoDecimals(value).toFixed(2);
}
