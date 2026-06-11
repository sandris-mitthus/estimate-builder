import { POSITION_COST_TYPE_LABELS } from "@/app/lib/positions/position-cost-type";
import type { PositionPriceSummary } from "@/app/lib/positions/types";

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

export function getVisiblePositions(
  positions: PositionPriceSummary[],
  query: string,
): PositionPriceSummary[] {
  return filterPositionsByQuery(sortPositionsByName(positions), query);
}
