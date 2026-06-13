import { multiplyBreakdown } from "@/app/lib/estimates/calculate-line";
import { normalizeLineItemModuleSizeAttachment } from "@/app/lib/estimates/module-size-attachment";
import { collectRowLineItems } from "@/app/lib/estimates/multi-position";
import { buildUnitPriceForCatalogPosition } from "@/app/lib/positions/apply-catalog-to-line-item";
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
  defaultHourlyRate: number | null,
): PriceBreakdown {
  const position = item.positionPriceId
    ? catalogById.get(item.positionPriceId)
    : undefined;
  const unitPrice = position
    ? buildUnitPriceForCatalogPosition(position, defaultHourlyRate)
    : item.unitPrice;

  const hasModuleSize =
    !item.variableQuantity &&
    normalizeLineItemModuleSizeAttachment(item.moduleSizeAttachment) != null;
  const shouldApplyQuantity =
    (item.variableQuantity === true || position?.variableQuantity === true || hasModuleSize) &&
    item.quantity > 0;

  if (shouldApplyQuantity) {
    return multiplyBreakdown(item.quantity, unitPrice);
  }

  return unitPrice;
}

export function calculateEstimateTotals(
  categories: EstimateCategory[],
  catalogPositions: PositionPriceSummary[] = [],
  defaultHourlyRate: number | null = null,
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
    const breakdown = resolveLineItemBreakdown(
      item,
      catalogById,
      defaultHourlyRate,
    );
    totals.labor += breakdown.labor;
    totals.materials += breakdown.materials;
    totals.mechanisms += breakdown.mechanisms;
  }

  totals.grand = totals.labor + totals.materials + totals.mechanisms;
  return totals;
}

