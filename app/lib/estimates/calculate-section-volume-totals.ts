import { roundToTwoDecimals } from "@/app/lib/estimates/calculate-line";
import { applyPlannedProfitPercent } from "@/app/lib/estimates/planned-profit";
import { splitRowsForTotals } from "@/app/lib/estimates/multi-position";
import {
  hasModuleSizeAttachment,
  resolveLineItemDisplayQuantityFromModuleSize,
} from "@/app/lib/estimates/sync-module-size-quantities";
import {
  resolveLaborWorkloadHours,
  resolveLineItemVolumeSum,
} from "@/app/lib/estimates/volume-sum-calculations";
import type {
  EstimateCategory,
  EstimateRowItem,
  EstimateSubcategory,
  PriceBreakdown,
} from "@/app/lib/estimates/types";
import type { BuildingModuleSizeOption } from "@/app/lib/modules/types";
import type { PositionPriceSummary } from "@/app/lib/positions/types";
import {
  resolveFrozenEstimateDisplayUnitPrice,
  resolveLiveDisplayUnitPrice,
} from "@/app/lib/positions/stale-catalog-price";
import { isVariableQuantityLineItem } from "@/app/lib/positions/variable-quantity";

export type SectionVolumeTotals = {
  volumeSum: PriceBreakdown | null;
  laborWorkloadHours: number | null;
  /** Aptuveno budžetu summa — bez sadalījuma, pieskaitāma sekcijas kopsummai. */
  attentionBudget: number;
};

type CalculateSectionVolumeTotalsOptions = {
  catalogPositions: PositionPriceSummary[];
  defaultHourlyRate: number | null;
  plannedProfitPercent?: number;
  moduleSizeOptions?: BuildingModuleSizeOption[];
  highlightStaleCatalogPrices?: boolean;
};

function addBreakdowns(
  left: PriceBreakdown,
  right: PriceBreakdown,
): PriceBreakdown {
  return {
    labor: roundToTwoDecimals(left.labor + right.labor),
    materials: roundToTwoDecimals(left.materials + right.materials),
    mechanisms: roundToTwoDecimals(left.mechanisms + right.mechanisms),
  };
}

export function calculateRowsVolumeTotals(
  rows: EstimateRowItem[],
  {
    catalogPositions,
    defaultHourlyRate,
    plannedProfitPercent = 0,
    moduleSizeOptions = [],
    highlightStaleCatalogPrices = false,
  }: CalculateSectionVolumeTotalsOptions,
): SectionVolumeTotals {
  let volumeSum: PriceBreakdown | null = null;
  let laborWorkloadHours: number | null = null;
  const { items, attentionBudget } = splitRowsForTotals(rows);

  for (const item of items) {
    const attachedQuantity = resolveLineItemDisplayQuantityFromModuleSize(
      item,
      moduleSizeOptions,
    );
    const hasAttachedQuantity =
      !item.variableQuantity &&
      hasModuleSizeAttachment(item) &&
      attachedQuantity != null;
    const volumeVariable =
      isVariableQuantityLineItem(item, catalogPositions) || hasAttachedQuantity;

    if (!volumeVariable) {
      continue;
    }

    const effectiveQuantity = attachedQuantity ?? item.quantity;
    const displayUnitPrice = applyPlannedProfitPercent(
      highlightStaleCatalogPrices
        ? resolveFrozenEstimateDisplayUnitPrice(
            item,
            catalogPositions,
            defaultHourlyRate,
          )
        : resolveLiveDisplayUnitPrice(item, catalogPositions, defaultHourlyRate),
      plannedProfitPercent,
    );
    const rowVolumeSum = resolveLineItemVolumeSum(
      effectiveQuantity,
      displayUnitPrice,
      true,
    );

    if (rowVolumeSum) {
      volumeSum = volumeSum
        ? addBreakdowns(volumeSum, rowVolumeSum)
        : rowVolumeSum;
    }

    const rowWorkloadHours = resolveLaborWorkloadHours(
      effectiveQuantity,
      item,
      true,
    );
    if (rowWorkloadHours != null && rowWorkloadHours > 0) {
      laborWorkloadHours = roundToTwoDecimals(
        (laborWorkloadHours ?? 0) + rowWorkloadHours,
      );
    }
  }

  return { volumeSum, laborWorkloadHours, attentionBudget };
}

export function calculateSubcategoryVolumeTotals(
  subcategory: EstimateSubcategory,
  options: CalculateSectionVolumeTotalsOptions,
): SectionVolumeTotals {
  return calculateRowsVolumeTotals(subcategory.items, options);
}

export function calculateCategoryVolumeTotals(
  category: EstimateCategory,
  options: CalculateSectionVolumeTotalsOptions,
): SectionVolumeTotals {
  const rows: EstimateRowItem[] = [
    ...category.items,
    ...category.subcategories.flatMap((subcategory) => subcategory.items),
  ];

  return calculateRowsVolumeTotals(rows, options);
}

/** Summētā darbietilpība (c/h) visai tāmei — tāpat kā tabulas apjoma kolonnā. */
export function calculateEstimateLaborWorkloadHours(
  categories: EstimateCategory[],
  options: CalculateSectionVolumeTotalsOptions,
): number {
  const rows: EstimateRowItem[] = [];

  for (const category of categories) {
    if (category.hiddenInEstimate) {
      continue;
    }

    rows.push(...category.items);

    for (const subcategory of category.subcategories) {
      if (subcategory.hiddenInEstimate) {
        continue;
      }

      rows.push(...subcategory.items);
    }
  }

  return calculateRowsVolumeTotals(rows, options).laborWorkloadHours ?? 0;
}
