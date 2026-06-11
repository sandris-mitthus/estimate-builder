import {
  calculateEstimateTotals,
  collectEstimateLineItems,
} from "@/app/lib/estimates/calculate-totals";
import type { EstimateLineItem } from "@/app/lib/estimates/types";
import type { EstimatePositionSection } from "@/app/lib/estimate-positions/types";

export function collectSectionLineItems(
  sections: EstimatePositionSection[],
): EstimateLineItem[] {
  return collectEstimateLineItems(sections);
}

export function calculateSectionTotals(sections: EstimatePositionSection[]) {
  return calculateEstimateTotals(sections);
}
