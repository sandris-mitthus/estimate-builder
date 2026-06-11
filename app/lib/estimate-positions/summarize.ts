import { collectSectionLineItems } from "@/app/lib/estimate-positions/collect-section-items";
import type { EstimatePositionSection, EstimatePositionSummary } from "@/app/lib/estimate-positions/types";

export function summarizeEstimatePosition(input: {
  id: string;
  name: string;
  title: string;
  sections: EstimatePositionSection[];
  createdAt: string;
}): EstimatePositionSummary {
  const sections = Array.isArray(input.sections) ? input.sections : [];

  return {
    id: input.id,
    name: input.name,
    title: input.title.trim() || input.name,
    sectionCount: sections.length,
    lineItemCount: collectSectionLineItems(sections).length,
    createdAt: input.createdAt,
  };
}