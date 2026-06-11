import { createSampleCategories } from "@/app/lib/estimates/sample-data";
import type { EstimateCategory } from "@/app/lib/estimates/types";
import type {
  EstimatePositionDocument,
  EstimatePositionSection,
  EstimatePositionSummary,
} from "@/app/lib/estimate-positions/types";
import {
  DEFAULT_SAGATAVE_TITLE,
  SAMPLE_SAGATAVE_ID,
} from "@/app/lib/estimate-positions/default-sagatave";
import { summarizeEstimatePosition } from "@/app/lib/estimate-positions/summarize";

function sectionsFromCategories(
  categories: EstimateCategory[],
): EstimatePositionSection[] {
  return categories.map((category) => ({
    id: category.id,
    title: category.title,
    subcategories: category.subcategories,
    items: category.items,
  }));
}

const SAMPLE_SECTIONS = sectionsFromCategories(createSampleCategories());

const SAMPLE_SAGATAVE_SUMMARY = summarizeEstimatePosition({
  id: SAMPLE_SAGATAVE_ID,
  name: DEFAULT_SAGATAVE_TITLE,
  title: DEFAULT_SAGATAVE_TITLE,
  sections: SAMPLE_SECTIONS,
  createdAt: "2026-01-15T10:00:00.000Z",
});

export const SAMPLE_ESTIMATE_POSITIONS: EstimatePositionSummary[] = [
  SAMPLE_SAGATAVE_SUMMARY,
];

export function getSampleEstimatePosition(): EstimatePositionDocument {
  return {
    id: SAMPLE_SAGATAVE_SUMMARY.id,
    name: SAMPLE_SAGATAVE_SUMMARY.name,
    title: SAMPLE_SAGATAVE_SUMMARY.title,
    sections: SAMPLE_SECTIONS,
    multiOptionLinks: [],
    createdAt: SAMPLE_SAGATAVE_SUMMARY.createdAt,
  };
}
