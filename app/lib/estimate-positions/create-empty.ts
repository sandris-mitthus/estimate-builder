import {
  createLineItem,
  createSubcategory,
} from "@/app/lib/estimates/create-empty";
import type { EstimatePositionSection } from "@/app/lib/estimate-positions/types";

export function normalizeEstimatePositionSection(
  section: EstimatePositionSection,
): EstimatePositionSection {
  return {
    ...section,
    subcategories: Array.isArray(section.subcategories)
      ? section.subcategories
      : [],
    items: Array.isArray(section.items) ? section.items : [],
  };
}

export function createEstimatePositionSection(): EstimatePositionSection {
  return {
    id: crypto.randomUUID(),
    title: "",
    subcategories: [],
    items: [createLineItem()],
  };
}

export function ensureSectionHasLineItem(
  section: EstimatePositionSection,
): EstimatePositionSection {
  const normalized = normalizeEstimatePositionSection(section);
  const hasSubcategoryItems = normalized.subcategories.some(
    (subcategory) => subcategory.items.length > 0,
  );

  if (normalized.items.length > 0 || hasSubcategoryItems) {
    return normalized;
  }

  return {
    ...normalized,
    items: [createLineItem()],
  };
}

export { createLineItem, createSubcategory };
