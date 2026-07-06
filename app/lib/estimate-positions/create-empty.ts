import {
  createLineItem,
  createSubcategory,
} from "@/app/lib/estimates/create-empty";
import { resolveEstimateGroupTitle } from "@/app/lib/estimates/resolve-group-title";
import type { EstimateSubcategory } from "@/app/lib/estimates/types";
import type { EstimatePositionSection } from "@/app/lib/estimate-positions/types";

function normalizeEstimateSubcategory(
  subcategory: EstimateSubcategory & { name?: string },
): EstimateSubcategory {
  return {
    ...subcategory,
    title: resolveEstimateGroupTitle(subcategory),
    items: Array.isArray(subcategory.items) ? subcategory.items : [],
  };
}

export function normalizeEstimatePositionSection(
  section: EstimatePositionSection & { name?: string },
): EstimatePositionSection {
  return {
    ...section,
    title: resolveEstimateGroupTitle(section),
    subcategories: (Array.isArray(section.subcategories)
      ? section.subcategories
      : []
    ).map((subcategory) =>
      normalizeEstimateSubcategory(
        subcategory as EstimateSubcategory & { name?: string },
      ),
    ),
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
