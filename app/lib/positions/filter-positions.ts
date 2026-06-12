import {
  POSITION_COST_TYPE_LABELS,
  type CatalogPositionCostType,
} from "@/app/lib/positions/position-cost-type";
import type { PositionPriceSummary } from "@/app/lib/positions/types";

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
): PositionPriceSummary[] {
  const normalizedQuery = query.trim().toLocaleLowerCase("lv-LV");
  if (!normalizedQuery) {
    return positions;
  }

  return positions.filter((position) => {
    const name = position.name.toLocaleLowerCase("lv-LV");
    const unit = position.unit.toLocaleLowerCase("lv-LV");
    const costType = POSITION_COST_TYPE_LABELS[position.costType]
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
): PositionPriceSummary[] {
  const sorted = sortPositionsByName(positions);
  const byCostType = filterPositionsByCostType(sorted, costTypeFilter);

  return filterPositionsByQuery(byCostType, query);
}
