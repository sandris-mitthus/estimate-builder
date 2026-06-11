import {
  collectRowLineItems,
  isEstimateMultiPosition,
} from "@/app/lib/estimates/multi-position";
import type { EstimateLineItem, EstimateRowItem } from "@/app/lib/estimates/types";
import {
  applyCatalogPricesToLinkedLineItem,
  getMaterialsOrMechanismsUnitPrice,
  isMaterialsOrMechanismsCostType,
} from "@/app/lib/positions/apply-catalog-to-line-item";
import { updatePositionNameAndUnit } from "@/app/lib/positions/repository";
import type { PositionPriceSummary } from "@/app/lib/positions/types";

function normalizeCatalogText(value: string): string {
  return value.trim().toLocaleLowerCase("lv-LV");
}

function findCatalogMatchesByName(
  name: string,
  catalogPositions: PositionPriceSummary[],
): PositionPriceSummary[] {
  const normalizedName = normalizeCatalogText(name);
  if (!normalizedName) {
    return [];
  }

  return catalogPositions.filter(
    (position) => normalizeCatalogText(position.name) === normalizedName,
  );
}

export function resolveLineItemPositionPriceId(
  item: EstimateLineItem,
  catalogPositions: PositionPriceSummary[],
): string | undefined {
  if (item.positionPriceId) {
    const linked = catalogPositions.find(
      (position) => position.id === item.positionPriceId,
    );
    if (linked) {
      return item.positionPriceId;
    }
  }

  const nameMatches = findCatalogMatchesByName(item.name, catalogPositions);
  if (nameMatches.length === 0) {
    return undefined;
  }

  const normalizedUnit = normalizeCatalogText(item.unit);
  const nameAndUnitMatches = nameMatches.filter(
    (position) => normalizeCatalogText(position.unit) === normalizedUnit,
  );

  if (nameAndUnitMatches.length === 1) {
    return nameAndUnitMatches[0].id;
  }

  return nameMatches.length === 1 ? nameMatches[0].id : undefined;
}

export function findCatalogPositionForLineItem(
  item: EstimateLineItem,
  catalogPositions: PositionPriceSummary[],
): PositionPriceSummary | undefined {
  const positionPriceId = resolveLineItemPositionPriceId(item, catalogPositions);
  if (!positionPriceId) {
    return undefined;
  }

  return catalogPositions.find((position) => position.id === positionPriceId);
}

export function isMaterialsOrMechanismsLineItem(
  item: EstimateLineItem,
  catalogPositions: PositionPriceSummary[],
): boolean {
  const catalogPosition = findCatalogPositionForLineItem(item, catalogPositions);
  if (catalogPosition) {
    return isMaterialsOrMechanismsCostType(catalogPosition.costType);
  }

  return getMaterialsOrMechanismsUnitPrice(item.unitPrice) != null;
}

export function attachCatalogLinkToLineItem(
  item: EstimateLineItem,
  catalogPositions: PositionPriceSummary[],
): EstimateLineItem {
  const positionPriceId = resolveLineItemPositionPriceId(item, catalogPositions);
  if (!positionPriceId) {
    return item;
  }

  if (positionPriceId === item.positionPriceId) {
    return item;
  }

  return { ...item, positionPriceId };
}

function hasLineItemUnitPrices(item: EstimateLineItem): boolean {
  return (
    item.unitPrice.labor > 0 ||
    item.unitPrice.materials > 0 ||
    item.unitPrice.mechanisms > 0
  );
}

export function hydrateLineItemWithCatalog(
  item: EstimateLineItem,
  catalogPositions: PositionPriceSummary[],
  defaultHourlyRate: number | null,
  options?: { forceCatalogPrices?: boolean },
): EstimateLineItem {
  const position = findCatalogPositionForLineItem(item, catalogPositions);
  if (!position) {
    return item;
  }

  const linkedItem =
    item.positionPriceId === position.id
      ? item
      : { ...item, positionPriceId: position.id };

  const shouldApplyCatalogPrices =
    options?.forceCatalogPrices || !hasLineItemUnitPrices(item);

  if (!shouldApplyCatalogPrices) {
    return linkedItem;
  }

  return applyCatalogPricesToLinkedLineItem(
    linkedItem,
    position,
    defaultHourlyRate,
  );
}

/** Saglabā esošo kataloga saiti, arī ja mainās nosaukums vai mērvienība. */
export function applyLineItemCatalogEdit(
  item: EstimateLineItem,
  updates: Partial<EstimateLineItem>,
  catalogPositions: PositionPriceSummary[],
): EstimateLineItem {
  const next = { ...item, ...updates };

  if (item.positionPriceId) {
    const stillLinked = catalogPositions.some(
      (position) => position.id === item.positionPriceId,
    );
    if (stillLinked) {
      return { ...next, positionPriceId: item.positionPriceId };
    }
  }

  return attachCatalogLinkToLineItem(next, catalogPositions);
}

export type HydrateCatalogLinksOptions = {
  /** Sagatavē cenas vienmēr no kataloga / iestatījumiem, nevis no saglabātā dokumenta. */
  forceCatalogPrices?: boolean;
};

function hydrateRowsWithCatalog(
  rows: EstimateRowItem[],
  catalogPositions: PositionPriceSummary[],
  defaultHourlyRate: number | null,
  options?: HydrateCatalogLinksOptions,
): EstimateRowItem[] {
  return rows.map((row) => {
    if (isEstimateMultiPosition(row)) {
      return {
        ...row,
        options: row.options.map((option) => ({
          ...option,
          lineItem: hydrateLineItemWithCatalog(
            option.lineItem,
            catalogPositions,
            defaultHourlyRate,
            options,
          ),
        })),
      };
    }

    return hydrateLineItemWithCatalog(
      row,
      catalogPositions,
      defaultHourlyRate,
      options,
    );
  });
}

export function hydrateSectionsWithCatalogLinks<
  T extends {
    items: EstimateRowItem[];
    subcategories?: { items: EstimateRowItem[] }[];
  },
>(
  sections: T[],
  catalogPositions: PositionPriceSummary[],
  defaultHourlyRate: number | null = null,
  options?: HydrateCatalogLinksOptions,
): T[] {
  return sections.map((section) => ({
    ...section,
    items: hydrateRowsWithCatalog(
      section.items,
      catalogPositions,
      defaultHourlyRate,
      options,
    ),
    subcategories: (section.subcategories ?? []).map((subcategory) => ({
      ...subcategory,
      items: hydrateRowsWithCatalog(
        subcategory.items,
        catalogPositions,
        defaultHourlyRate,
        options,
      ),
    })),
  }));
}

export function collectRowsLineItems(rows: EstimateRowItem[]): EstimateLineItem[] {
  return collectRowLineItems(rows);
}

export async function syncEstimateLineItemsToCatalog(
  items: EstimateLineItem[],
  catalogPositions: PositionPriceSummary[],
): Promise<{ ok: true } | { ok: false; error: string }> {
  const syncedIds = new Set<string>();

  for (const item of items) {
    const positionPriceId = resolveLineItemPositionPriceId(item, catalogPositions);
    const name = item.name.trim();
    const unit = item.unit.trim();

    if (!positionPriceId || !name || !unit || syncedIds.has(positionPriceId)) {
      continue;
    }

    const result = await updatePositionNameAndUnit({
      id: positionPriceId,
      name,
      unit,
    });

    if (!result.ok) {
      return result;
    }

    syncedIds.add(positionPriceId);
  }

  return { ok: true };
}
