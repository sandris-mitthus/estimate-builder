import type { EstimateLineItem } from "@/app/lib/estimates/types";

/** Piedāvājuma PDF — rindas cena nav redzama (tikai kopsummās). */
export function shouldHideLineItemOfferExportPrice(
  item: EstimateLineItem,
): boolean {
  return (
    item.hiddenPriceInOffer === true || item.showOnlyTotalPrice === true
  );
}

/** Excel tāme — rindā rāda tikai gala summu kolonnā Kopā, bez vienības/apjoma sadalījuma. */
export function shouldHideLineItemEstimateExportBreakdown(
  item: EstimateLineItem,
): boolean {
  return item.showOnlyTotalPrice === true;
}
