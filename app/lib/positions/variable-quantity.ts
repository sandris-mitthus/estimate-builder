import type { EstimateLineItem } from "@/app/lib/estimates/types";
import type { PositionPriceSummary } from "@/app/lib/positions/types";

export function findCatalogPosition(
  positionPriceId: string | undefined,
  catalogPositions: PositionPriceSummary[],
): PositionPriceSummary | undefined {
  if (!positionPriceId) {
    return undefined;
  }

  return catalogPositions.find((position) => position.id === positionPriceId);
}

export function isVariableQuantityLineItem(
  item: EstimateLineItem,
  catalogPositions: PositionPriceSummary[],
): boolean {
  const position = findCatalogPosition(item.positionPriceId, catalogPositions);
  return position?.variableQuantity === true;
}

export function hasAnyVariableQuantityPosition(
  catalogPositions: PositionPriceSummary[],
): boolean {
  return catalogPositions.some((position) => position.variableQuantity);
}
