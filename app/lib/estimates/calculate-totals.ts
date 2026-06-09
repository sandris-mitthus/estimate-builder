import { multiplyBreakdown } from "@/app/lib/estimates/calculate-line";
import type {
  EstimateCategory,
  EstimateLineItem,
} from "@/app/lib/estimates/types";

export type EstimateTotals = {
  labor: number;
  materials: number;
  mechanisms: number;
  grand: number;
};

export function collectEstimateLineItems(
  categories: EstimateCategory[],
): EstimateLineItem[] {
  const items: EstimateLineItem[] = [];

  for (const category of categories) {
    items.push(...category.items);

    for (const subcategory of category.subcategories) {
      items.push(...subcategory.items);
    }
  }

  return items;
}

export function calculateEstimateTotals(
  categories: EstimateCategory[],
): EstimateTotals {
  const totals: EstimateTotals = {
    labor: 0,
    materials: 0,
    mechanisms: 0,
    grand: 0,
  };

  for (const item of collectEstimateLineItems(categories)) {
    const volume = multiplyBreakdown(item.quantity, item.unitPrice);
    totals.labor += volume.labor;
    totals.materials += volume.materials;
    totals.mechanisms += volume.mechanisms;
  }

  totals.grand = totals.labor + totals.materials + totals.mechanisms;
  return totals;
}
