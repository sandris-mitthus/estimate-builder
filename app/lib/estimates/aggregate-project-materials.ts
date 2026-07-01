import {
  roundToTwoDecimals,
} from "@/app/lib/estimates/calculate-line";
import { collectEstimateLineItems } from "@/app/lib/estimates/calculate-totals";
import {
  isCompositeLineItem,
  resolveCatalogRefUnitPrice,
  resolveEffectiveMaterials,
} from "@/app/lib/estimates/composite-line-item";
import { resolveMaterialTotalQuantity } from "@/app/lib/estimates/material-consumption-basis";
import { normalizeLineItemModuleSizeAttachment } from "@/app/lib/estimates/module-size-attachment";
import { resolveLineItemDisplayQuantityFromModuleSize } from "@/app/lib/estimates/sync-module-size-quantities";
import type {
  EstimateCategory,
  EstimateLineItem,
  LineItemCatalogRef,
} from "@/app/lib/estimates/types";
import {
  resolvePositionCatalogUnitPrice,
} from "@/app/lib/positions/apply-catalog-to-line-item";
import {
  findCatalogPositionForLineItem,
  isMaterialsOrMechanismsLineItem,
} from "@/app/lib/positions/sync-from-estimate-line-items";
import { roundQuantity } from "@/app/lib/positions/variable-quantity";
import type { BuildingModuleSizeOption } from "@/app/lib/modules/types";
import type { PositionPriceSummary } from "@/app/lib/positions/types";

export type AggregatedProjectMaterial = {
  positionPriceId: string;
  name: string;
  unit: string;
  quantity: number;
  /** Budžeta cena uz mērvienību (no apstiprinātās tāmes). */
  unitPrice: number;
  budgetTotal: number;
  /** Aktuālā kataloga cena uz mērvienību. */
  catalogUnitPrice: number;
  /** Kataloga cena atšķiras no budžeta cenas. */
  hasPriceChange: boolean;
};

type MaterialContribution = {
  positionPriceId: string;
  name: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  budgetTotal: number;
};

function resolveLineItemPositionQuantity(
  item: EstimateLineItem,
  moduleSizeOptions: BuildingModuleSizeOption[],
): number {
  const attachedQuantity = resolveLineItemDisplayQuantityFromModuleSize(
    item,
    moduleSizeOptions,
  );
  const quantity = attachedQuantity ?? item.quantity;
  return roundQuantity(quantity);
}

function shouldApplyLineItemQuantity(item: EstimateLineItem): boolean {
  const hasModuleSize =
    !item.variableQuantity &&
    normalizeLineItemModuleSizeAttachment(item.moduleSizeAttachment) != null;

  return item.variableQuantity === true || hasModuleSize;
}

function addContribution(
  map: Map<string, MaterialContribution>,
  contribution: MaterialContribution,
): void {
  if (contribution.quantity <= 0 || contribution.budgetTotal <= 0) {
    return;
  }

  const existing = map.get(contribution.positionPriceId);
  if (!existing) {
    map.set(contribution.positionPriceId, { ...contribution });
    return;
  }

  map.set(contribution.positionPriceId, {
    ...existing,
    quantity: roundQuantity(existing.quantity + contribution.quantity),
    budgetTotal: roundToTwoDecimals(existing.budgetTotal + contribution.budgetTotal),
  });
}

function contributionFromCatalogRef(
  ref: LineItemCatalogRef,
  item: EstimateLineItem,
  positionQuantity: number,
  unitPrice: number,
  moduleSizeOptions: BuildingModuleSizeOption[],
): MaterialContribution | null {
  if (unitPrice <= 0) {
    return null;
  }

  const quantity = resolveMaterialTotalQuantity(
    ref,
    item,
    positionQuantity,
    moduleSizeOptions,
  );
  const budgetTotal = roundToTwoDecimals(quantity * unitPrice);

  return {
    positionPriceId: ref.positionPriceId,
    name: ref.name,
    unit: ref.unit,
    quantity,
    unitPrice,
    budgetTotal,
  };
}

function resolveFrozenCompositeMaterialUnitPrice(
  ref: LineItemCatalogRef,
  item: EstimateLineItem,
  catalogPositions: PositionPriceSummary[],
): number {
  const refs = resolveEffectiveMaterials(item);
  const frozenPerPositionUnit = roundToTwoDecimals(item.unitPrice.materials);
  if (frozenPerPositionUnit <= 0) {
    return resolveCatalogRefUnitPrice(ref, catalogPositions);
  }

  const consumption = ref.consumption ?? 1;
  const weightedShares = refs.map((entry) => {
    const entryConsumption = entry.consumption ?? 1;
    return {
      ref: entry,
      weight:
        resolveCatalogRefUnitPrice(entry, catalogPositions) * entryConsumption,
    };
  });
  const totalWeight = weightedShares.reduce((sum, entry) => sum + entry.weight, 0);

  if (totalWeight <= 0) {
    const equalShare = frozenPerPositionUnit / Math.max(refs.length, 1);
    return roundToTwoDecimals(equalShare / consumption);
  }

  const refWeight =
    resolveCatalogRefUnitPrice(ref, catalogPositions) * consumption;
  const frozenContribution = frozenPerPositionUnit * (refWeight / totalWeight);

  return roundToTwoDecimals(frozenContribution / consumption);
}

function collectCompositeMaterialContributions(
  item: EstimateLineItem,
  moduleSizeOptions: BuildingModuleSizeOption[],
  catalogPositions: PositionPriceSummary[],
  useFrozenPrices: boolean,
): MaterialContribution[] {
  const positionQuantity = shouldApplyLineItemQuantity(item)
    ? resolveLineItemPositionQuantity(item, moduleSizeOptions)
    : 1;

  if (shouldApplyLineItemQuantity(item) && positionQuantity <= 0) {
    return [];
  }

  return resolveEffectiveMaterials(item)
    .map((ref) => {
      const unitPrice = useFrozenPrices
        ? resolveFrozenCompositeMaterialUnitPrice(ref, item, catalogPositions)
        : resolveCatalogRefUnitPrice(ref, catalogPositions);

      return contributionFromCatalogRef(
        ref,
        item,
        positionQuantity,
        unitPrice,
        moduleSizeOptions,
      );
    })
    .filter((entry): entry is MaterialContribution => entry != null);
}

function collectDirectMaterialContribution(
  item: EstimateLineItem,
  moduleSizeOptions: BuildingModuleSizeOption[],
  catalogPositions: PositionPriceSummary[],
  useFrozenPrices: boolean,
): MaterialContribution | null {
  const catalogPosition = findCatalogPositionForLineItem(item, catalogPositions);
  if (!catalogPosition || catalogPosition.costType !== "materials") {
    return null;
  }

  const positionQuantity = shouldApplyLineItemQuantity(item)
    ? resolveLineItemPositionQuantity(item, moduleSizeOptions)
    : 1;

  if (shouldApplyLineItemQuantity(item) && positionQuantity <= 0) {
    return null;
  }

  const unitPrice =
    useFrozenPrices && item.unitPrice.materials > 0
      ? roundToTwoDecimals(item.unitPrice.materials)
      : resolvePositionCatalogUnitPrice(catalogPosition) ?? 0;

  if (unitPrice <= 0) {
    return null;
  }

  const quantity = roundQuantity(positionQuantity);
  const budgetTotal = roundToTwoDecimals(quantity * unitPrice);

  return {
    positionPriceId: catalogPosition.id,
    name: catalogPosition.name,
    unit: catalogPosition.unit,
    quantity,
    unitPrice,
    budgetTotal,
  };
}

function collectLineItemMaterialContributions(
  item: EstimateLineItem,
  moduleSizeOptions: BuildingModuleSizeOption[],
  catalogPositions: PositionPriceSummary[],
  useFrozenPrices: boolean,
): MaterialContribution[] {
  if (isCompositeLineItem(item)) {
    return collectCompositeMaterialContributions(
      item,
      moduleSizeOptions,
      catalogPositions,
      useFrozenPrices,
    );
  }

  if (
    !isMaterialsOrMechanismsLineItem(item, catalogPositions) ||
    findCatalogPositionForLineItem(item, catalogPositions)?.costType !==
      "materials"
  ) {
    return [];
  }

  const direct = collectDirectMaterialContribution(
    item,
    moduleSizeOptions,
    catalogPositions,
    useFrozenPrices,
  );

  return direct ? [direct] : [];
}

export function aggregateProjectMaterials(
  categories: EstimateCategory[],
  catalogPositions: PositionPriceSummary[],
  moduleSizeOptions: BuildingModuleSizeOption[],
  options?: { useFrozenPrices?: boolean },
): AggregatedProjectMaterial[] {
  const useFrozenPrices = options?.useFrozenPrices ?? false;
  const map = new Map<string, MaterialContribution>();

  for (const item of collectEstimateLineItems(categories, { forTotals: true })) {
    for (const contribution of collectLineItemMaterialContributions(
      item,
      moduleSizeOptions,
      catalogPositions,
      useFrozenPrices,
    )) {
      addContribution(map, contribution);
    }
  }

  return Array.from(map.values())
    .map((row) => enrichMaterialWithCatalogPrice(row, catalogPositions))
    .sort((left, right) => left.name.localeCompare(right.name, "lv"));
}

function enrichMaterialWithCatalogPrice(
  row: Omit<AggregatedProjectMaterial, "catalogUnitPrice" | "hasPriceChange">,
  catalogPositions: PositionPriceSummary[],
): AggregatedProjectMaterial {
  const catalogPosition = catalogPositions.find(
    (position) => position.id === row.positionPriceId,
  );
  const catalogUnitPrice = roundToTwoDecimals(
    resolvePositionCatalogUnitPrice(catalogPosition ?? ({} as PositionPriceSummary)) ?? 0,
  );
  const hasPriceChange =
    roundToTwoDecimals(row.unitPrice) !== catalogUnitPrice &&
    (catalogUnitPrice > 0 || row.unitPrice > 0);

  return {
    ...row,
    catalogUnitPrice,
    hasPriceChange,
  };
}
