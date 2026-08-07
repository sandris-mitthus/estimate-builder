import type { PositionPriceSummary } from "@/app/lib/positions/types";

/**
 * Trims catalog rows to the fields the estimate editors actually use.
 * Supplier details and price timestamps are only needed on `/positions`, so
 * they are dropped before the catalog is serialized to the client.
 */
export function toEstimateCatalogPositions(
  positions: PositionPriceSummary[],
): PositionPriceSummary[] {
  return positions.map((position) => ({
    id: position.id,
    name: position.name,
    unit: position.unit,
    unitPrice: position.unitPrice,
    costType: position.costType,
    variableQuantity: position.variableQuantity,
  }));
}
