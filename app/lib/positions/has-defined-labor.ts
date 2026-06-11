import { isAmountDisplayEmpty } from "@/app/lib/estimates/calculate-line";
import type { EstimateLineItem } from "@/app/lib/estimates/types";
import { buildUnitPriceForCatalogPosition } from "@/app/lib/positions/apply-catalog-to-line-item";
import { findCatalogPositionForLineItem } from "@/app/lib/positions/sync-from-estimate-line-items";
import type { PositionPriceSummary } from "@/app/lib/positions/types";

/** Pozīcijai ir definēts darbs — kataloga `cost_type = labor` vai redzama Darbs kolonnas vērtība. */
export function hasDefinedLaborLineItem(
  item: EstimateLineItem,
  catalogPositions: PositionPriceSummary[],
  defaultHourlyRate: number | null,
): boolean {
  const catalog = findCatalogPositionForLineItem(item, catalogPositions);
  if (catalog?.costType === "labor") {
    return true;
  }

  const unitPrice = catalog
    ? buildUnitPriceForCatalogPosition(catalog, defaultHourlyRate)
    : item.unitPrice;

  return !isAmountDisplayEmpty(unitPrice.labor);
}