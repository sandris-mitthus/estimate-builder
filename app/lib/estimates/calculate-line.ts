import type { PriceBreakdown } from "@/app/lib/estimates/types";

export function sumBreakdown(values: PriceBreakdown): number {
  return values.labor + values.materials + values.mechanisms;
}

export function multiplyBreakdown(
  quantity: number,
  unitPrice: PriceBreakdown,
): PriceBreakdown {
  return {
    labor: quantity * unitPrice.labor,
    materials: quantity * unitPrice.materials,
    mechanisms: quantity * unitPrice.mechanisms,
  };
}

export function formatAmount(value: number): string {
  if (!Number.isFinite(value)) return "0.00";
  return value.toFixed(2);
}
