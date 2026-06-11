import {
  collectAllDragIds,
  reorderEstimate,
} from "@/app/lib/estimates/reorder-estimate";
import type { EstimatePositionSection } from "@/app/lib/estimate-positions/types";

export function collectSectionDragIds(
  sections: EstimatePositionSection[],
): string[] {
  return collectAllDragIds(sections);
}

export function reorderEstimatePositionSections(
  sections: EstimatePositionSection[],
  activeDragId: string,
  overDragId: string,
): EstimatePositionSection[] {
  return reorderEstimate(sections, activeDragId, overDragId);
}
