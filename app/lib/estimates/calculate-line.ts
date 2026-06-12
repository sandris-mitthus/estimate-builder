import type { PriceBreakdown } from "@/app/lib/estimates/types";

/**
 * Pievieno atstarpi kā tūkstošu atdalītāju veselajai daļai.
 * Ieejas virkne ir `toFixed(n)` rezultāts (decimālatdalītājs — punkts).
 * Piemērs: "1234567.89" → "1 234 567.89"
 */
export function addThousandSeparators(formatted: string): string {
  const dotIndex = formatted.indexOf(".");
  const intPart = dotIndex >= 0 ? formatted.slice(0, dotIndex) : formatted;
  const decPart = dotIndex >= 0 ? formatted.slice(dotIndex) : "";
  const intFormatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, "\u00A0");
  return intFormatted + decPart;
}

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
  return addThousandSeparators(roundToTwoDecimals(value).toFixed(2));
}

export function isAmountDisplayEmpty(value: number): boolean {
  return !Number.isFinite(value) || value === 0;
}

/** Tāmes tabulu šūnām: 0 vai nederīgs → "—". */
export function formatAmountDisplay(value: number): string {
  if (isAmountDisplayEmpty(value)) {
    return "—";
  }

  return addThousandSeparators(roundToTwoDecimals(value).toFixed(2));
}
