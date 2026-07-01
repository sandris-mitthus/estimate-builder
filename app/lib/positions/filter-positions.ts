import {
  getPositionCostTypeLabel,
  type CatalogPositionCostType,
} from "@/app/lib/positions/position-cost-type";
import type { TranslationParams } from "@/app/lib/i18n/translations";
import type { PositionPriceSummary } from "@/app/lib/positions/types";

type Translate = (
  key: string,
  fallback?: string,
  params?: TranslationParams,
) => string;

export type PositionCostTypeFilter = "all" | CatalogPositionCostType;

const positionNameCollator = new Intl.Collator("lv-LV", {
  numeric: true,
  sensitivity: "base",
});

/** Meklēšanai — noņem diakritikas, lai `drats` atbilstu `drāts`. */
export function normalizePositionSearchText(value: string): string {
  return value
    .toLocaleLowerCase("lv-LV")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function filterCatalogPositions(
  positions: PositionPriceSummary[],
): PositionPriceSummary[] {
  return positions.filter((position) => position.costType !== "labor");
}

export function sortPositionsByName(
  positions: PositionPriceSummary[],
): PositionPriceSummary[] {
  return [...positions].sort((left, right) =>
    positionNameCollator.compare(left.name, right.name),
  );
}

export function filterPositionsByQuery(
  positions: PositionPriceSummary[],
  query: string,
  t?: Translate,
): PositionPriceSummary[] {
  const normalizedQuery = normalizePositionSearchText(query.trim());
  if (!normalizedQuery) {
    return positions;
  }

  return positions.filter((position) => {
    const name = normalizePositionSearchText(position.name);
    const unit = normalizePositionSearchText(position.unit);
    const costType = normalizePositionSearchText(
      getPositionCostTypeLabel(position.costType, t),
    );

    return (
      name.includes(normalizedQuery) ||
      unit.includes(normalizedQuery) ||
      costType.includes(normalizedQuery)
    );
  });
}

export function filterPositionsByCostType(
  positions: PositionPriceSummary[],
  costTypeFilter: PositionCostTypeFilter,
): PositionPriceSummary[] {
  if (costTypeFilter === "all") {
    return positions;
  }

  return positions.filter(
    (position) => position.costType === costTypeFilter,
  );
}

export function getVisiblePositions(
  positions: PositionPriceSummary[],
  query: string,
  costTypeFilter: PositionCostTypeFilter = "all",
  t?: Translate,
): PositionPriceSummary[] {
  const sorted = sortPositionsByName(positions);
  const byCostType = filterPositionsByCostType(sorted, costTypeFilter);

  return filterPositionsByQuery(byCostType, query, t);
}
