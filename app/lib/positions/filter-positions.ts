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

export function filterCatalogPositions(
  positions: PositionPriceSummary[],
): PositionPriceSummary[] {
  return positions.filter((position) => position.costType !== "labor");
}

export function sortPositionsByName(
  positions: PositionPriceSummary[],
): PositionPriceSummary[] {
  return [...positions].sort((left, right) =>
    left.name.localeCompare(right.name, "lv-LV", { sensitivity: "base" }),
  );
}

export function filterPositionsByQuery(
  positions: PositionPriceSummary[],
  query: string,
  t?: Translate,
): PositionPriceSummary[] {
  const normalizedQuery = query.trim().toLocaleLowerCase("lv-LV");
  if (!normalizedQuery) {
    return positions;
  }

  return positions.filter((position) => {
    const name = position.name.toLocaleLowerCase("lv-LV");
    const unit = position.unit.toLocaleLowerCase("lv-LV");
    const costType = getPositionCostTypeLabel(position.costType, t)
      .toLocaleLowerCase("lv-LV");

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
