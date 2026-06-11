import { multiplyBreakdown } from "@/app/lib/estimates/calculate-line";
import { collectRowLineItems } from "@/app/lib/estimates/multi-position";
import type {
  EstimateCategory,
  EstimateLineItem,
  PriceBreakdown,
} from "@/app/lib/estimates/types";
import type { PositionPriceSummary } from "@/app/lib/positions/types";

export type EstimateTotals = {
  labor: number;
  materials: number;
  mechanisms: number;
  grand: number;
};

export function collectEstimateLineItems(
  categories: EstimateCategory[],
  options?: { forTotals?: boolean },
): EstimateLineItem[] {
  const items: EstimateLineItem[] = [];

  for (const category of categories) {
    items.push(...collectRowLineItems(category.items, options));

    for (const subcategory of category.subcategories) {
      items.push(...collectRowLineItems(subcategory.items, options));
    }
  }

  return items;
}

function resolveLineItemBreakdown(
  item: EstimateLineItem,
  catalogById: Map<string, PositionPriceSummary>,
): PriceBreakdown {
  const position = item.positionPriceId
    ? catalogById.get(item.positionPriceId)
    : undefined;

  if (position?.variableQuantity && item.quantity > 0) {
    return multiplyBreakdown(item.quantity, item.unitPrice);
  }

  return item.unitPrice;
}

export function calculateEstimateTotals(
  categories: EstimateCategory[],
  catalogPositions: PositionPriceSummary[] = [],
): EstimateTotals {
  const catalogById = new Map(
    catalogPositions.map((position) => [position.id, position]),
  );
  const totals: EstimateTotals = {
    labor: 0,
    materials: 0,
    mechanisms: 0,
    grand: 0,
  };

  for (const item of collectEstimateLineItems(categories, { forTotals: true })) {
    const breakdown = resolveLineItemBreakdown(item, catalogById);
    totals.labor += breakdown.labor;
    totals.materials += breakdown.materials;
    totals.mechanisms += breakdown.mechanisms;
  }

  totals.grand = totals.labor + totals.materials + totals.mechanisms;
  return totals;
}
