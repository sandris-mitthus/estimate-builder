import { multiplyBreakdown } from "@/app/lib/estimates/calculate-line";
import { isCompositeLineItem } from "@/app/lib/estimates/composite-line-item";
import type { EstimateLineItem, PriceBreakdown } from "@/app/lib/estimates/types";
import { roundQuantity } from "@/app/lib/positions/variable-quantity";

export function resolveLineItemVolumeSum(
  quantity: number,
  unitPrice: PriceBreakdown,
  variableQuantity: boolean,
): PriceBreakdown | null {
  if (!variableQuantity) {
    return null;
  }

  return multiplyBreakdown(roundQuantity(quantity), unitPrice);
}

/** Darbietilpība (c/h) = apjoms × laika norma (tikai mainīga apjoma kompozītām pozīcijām). */
export function resolveLaborWorkloadHours(
  quantity: number,
  item: EstimateLineItem | null,
  variableQuantity: boolean,
): number | null {
  if (!variableQuantity || !item || !isCompositeLineItem(item)) {
    return null;
  }

  const timeNorm = item.laborTimeNorm;
  if (timeNorm == null || !Number.isFinite(timeNorm) || timeNorm <= 0) {
    return null;
  }

  const qty = roundQuantity(quantity);
  if (qty <= 0) {
    return null;
  }

  return roundQuantity(qty * timeNorm);
}
