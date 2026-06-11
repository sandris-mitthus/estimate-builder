import { formatAmountDisplay } from "@/app/lib/estimates/calculate-line";

export function parseModuleSizeAdjustment(value: string): number {
  const normalized = value.trim().replace(",", ".");
  if (!normalized) {
    return 0;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function formatModuleSizeEffectiveValue(
  baseValue: number,
  adjustment: string,
  unit: string | null,
): string {
  const delta = parseModuleSizeAdjustment(adjustment);
  const total = baseValue + delta;
  const formatted = formatAmountDisplay(total);

  if (!unit) {
    return formatted;
  }

  return `${formatted} ${unit}`;
}

export function hasModuleSizeAdjustment(adjustment: string): boolean {
  return adjustment.trim().length > 0;
}
