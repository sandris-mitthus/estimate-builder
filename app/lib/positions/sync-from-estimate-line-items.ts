import {
  hydrateCompositeLineItem,
  isCompositeLineItem,
} from "@/app/lib/estimates/composite-line-item";
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
import type { BuildingModuleSizeOption } from "@/app/lib/modules/types";
import type { PositionPriceSummary } from "@/app/lib/positions/types";

function normalizeCatalogText(value: string): string {
  return value.trim().toLocaleLowerCase("lv-LV");
}

export type CatalogLookup = {
  byId: Map<string, PositionPriceSummary>;
  byNormalizedName: Map<string, PositionPriceSummary[]>;
};

export function buildCatalogLookup(
  catalogPositions: PositionPriceSummary[],
): CatalogLookup {
  const byId = new Map<string, PositionPriceSummary>();
  const byNormalizedName = new Map<string, PositionPriceSummary[]>();

  for (const position of catalogPositions) {
    byId.set(position.id, position);
    const key = normalizeCatalogText(position.name);
    const matches = byNormalizedName.get(key);
    if (matches) {
      matches.push(position);
    } else {
      byNormalizedName.set(key, [position]);
    }
  }

  return { byId, byNormalizedName };
}

function findCatalogMatchesByName(
  name: string,
  catalogPositions: PositionPriceSummary[],
  lookup?: CatalogLookup,
): PositionPriceSummary[] {
  const normalizedName = normalizeCatalogText(name);
  if (!normalizedName) {
    return [];
  }

  if (lookup) {
    return lookup.byNormalizedName.get(normalizedName) ?? [];
  }

  return catalogPositions.filter(
    (position) => normalizeCatalogText(position.name) === normalizedName,
  );
}

export function resolveLineItemPositionPriceId(
  item: EstimateLineItem,
  catalogPositions: PositionPriceSummary[],
  lookup?: CatalogLookup,
): string | undefined {
  const catalogLookup = lookup ?? buildCatalogLookup(catalogPositions);

  if (item.positionPriceId) {
    if (catalogLookup.byId.has(item.positionPriceId)) {
      return item.positionPriceId;
    }
  }

  const nameMatches = findCatalogMatchesByName(item.name, catalogPositions, catalogLookup);
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
  lookup?: CatalogLookup,
): PositionPriceSummary | undefined {
  const positionPriceId = resolveLineItemPositionPriceId(
    item,
    catalogPositions,
    lookup,
  );
  if (!positionPriceId) {
    return undefined;
  }

  const catalogLookup = lookup ?? buildCatalogLookup(catalogPositions);
  return catalogLookup.byId.get(positionPriceId);
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
  options?: HydrateCatalogLinksOptions,
): EstimateLineItem {
  if (isCompositeLineItem(item)) {
    return hydrateCompositeLineItem(
      item,
      catalogPositions,
      defaultHourlyRate,
      options,
    );
  }

  const position = findCatalogPositionForLineItem(
    item,
    catalogPositions,
    options?.catalogLookup,
  );
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
  moduleSizeOptions?: BuildingModuleSizeOption[];
  catalogLookup?: CatalogLookup;
};

function hydrateRowsWithCatalog(
  rows: EstimateRowItem[],
  catalogPositions: PositionPriceSummary[],
  defaultHourlyRate: number | null,
  options?: HydrateCatalogLinksOptions,
): EstimateRowItem[] {
  const hydrateOptions = options?.catalogLookup
    ? options
    : {
        ...options,
        catalogLookup: buildCatalogLookup(catalogPositions),
      };

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
            hydrateOptions,
          ),
        })),
      };
    }

    return hydrateLineItemWithCatalog(
      row,
      catalogPositions,
      defaultHourlyRate,
      hydrateOptions,
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
  const hydrateOptions: HydrateCatalogLinksOptions = {
    ...options,
    catalogLookup:
      options?.catalogLookup ?? buildCatalogLookup(catalogPositions),
  };

  return sections.map((section) => ({
    ...section,
    items: hydrateRowsWithCatalog(
      section.items,
      catalogPositions,
      defaultHourlyRate,
      hydrateOptions,
    ),
    subcategories: (section.subcategories ?? []).map((subcategory) => ({
      ...subcategory,
      items: hydrateRowsWithCatalog(
        subcategory.items,
        catalogPositions,
        defaultHourlyRate,
        hydrateOptions,
      ),
    })),
  }));
}

export function collectRowsLineItems(rows: EstimateRowItem[]): EstimateLineItem[] {
  return collectRowLineItems(rows);
}
