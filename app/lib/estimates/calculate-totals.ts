import { multiplyBreakdown } from "@/app/lib/estimates/calculate-line";
import {
  applyPlannedProfitPercent,
  normalizePlannedProfitPercent,
} from "@/app/lib/estimates/planned-profit";
import {
  deriveCompositeUnitPrice,
  isCompositeLineItem,
} from "@/app/lib/estimates/composite-line-item";
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

export type EstimateLineItemPrices = {
  unitPrice: PriceBreakdown;
  lineTotal: PriceBreakdown;
};

type CatalogPositionMap = Map<string, PositionPriceSummary>;

export function resolveEstimateLineItemPrices(
  item: EstimateLineItem,
  catalogPositions: PositionPriceSummary[],
  defaultHourlyRate: number | null,
  plannedProfitPercent = 0,
): EstimateLineItemPrices {
  return resolveEstimateLineItemPricesWithCatalogMap(
    item,
    catalogPositions,
    buildCatalogPositionMap(catalogPositions),
    defaultHourlyRate,
    plannedProfitPercent,
  );
}

function buildCatalogPositionMap(
  catalogPositions: PositionPriceSummary[],
): CatalogPositionMap {
  return new Map(catalogPositions.map((position) => [position.id, position]));
}

function resolveEstimateLineItemPricesWithCatalogMap(
  item: EstimateLineItem,
  catalogPositions: PositionPriceSummary[],
  catalogById: CatalogPositionMap,
  defaultHourlyRate: number | null,
  plannedProfitPercent = 0,
): EstimateLineItemPrices {
  const hasModuleSize =
    !item.variableQuantity &&
    normalizeLineItemModuleSizeAttachment(item.moduleSizeAttachment) != null;

  if (isCompositeLineItem(item)) {
    const unitPrice = applyPlannedProfitPercent(
      deriveCompositeUnitPrice(item, catalogPositions, defaultHourlyRate),
      plannedProfitPercent,
    );
    const shouldApply = (item.variableQuantity === true || hasModuleSize) && item.quantity > 0;
    const lineTotal = shouldApply
      ? multiplyBreakdown(item.quantity, unitPrice)
      : unitPrice;
    return { unitPrice, lineTotal };
  }

  const position = item.positionPriceId
    ? catalogById.get(item.positionPriceId)
    : undefined;
  const unitPrice = applyPlannedProfitPercent(
    position
      ? buildUnitPriceForCatalogPosition(position, defaultHourlyRate)
      : item.unitPrice,
    plannedProfitPercent,
  );

  const shouldApplyQuantity =
    (item.variableQuantity === true ||
      position?.variableQuantity === true ||
      hasModuleSize) &&
    item.quantity > 0;

  const lineTotal = shouldApplyQuantity
    ? multiplyBreakdown(item.quantity, unitPrice)
    : unitPrice;

  return { unitPrice, lineTotal };
}

function resolveLineItemBreakdown(
  item: EstimateLineItem,
  catalogPositions: PositionPriceSummary[],
  catalogById: CatalogPositionMap,
  defaultHourlyRate: number | null,
  plannedProfitPercent = 0,
): PriceBreakdown {
  return resolveEstimateLineItemPricesWithCatalogMap(
    item,
    catalogPositions,
    catalogById,
    defaultHourlyRate,
    plannedProfitPercent,
  ).lineTotal;
}

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

export function calculateEstimateTotals(
  categories: EstimateCategory[],
  catalogPositions: PositionPriceSummary[] = [],
  defaultHourlyRate: number | null = null,
  plannedProfitPercent = 0,
): EstimateTotals {
  const profitPercent = normalizePlannedProfitPercent(plannedProfitPercent);
  const totals: EstimateTotals = {
    labor: 0,
    materials: 0,
    mechanisms: 0,
    grand: 0,
  };
  const catalogById = buildCatalogPositionMap(catalogPositions);

  for (const item of collectEstimateLineItems(categories, { forTotals: true })) {
    const breakdown = resolveLineItemBreakdown(
      item,
      catalogPositions,
      catalogById,
      defaultHourlyRate,
      profitPercent,
    );
    totals.labor += breakdown.labor;
    totals.materials += breakdown.materials;
    totals.mechanisms += breakdown.mechanisms;
  }

  totals.grand = totals.labor + totals.materials + totals.mechanisms;
  return totals;
}
