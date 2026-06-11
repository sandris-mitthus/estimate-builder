import { readCookie, writeCookie } from "@/app/lib/client/cookies";
import {
  categoryDragId,
  itemDragId,
  subcategoryDragId,
} from "@/app/lib/estimates/drag-ids";
import { getRowItemId } from "@/app/lib/estimates/multi-position";
import type { EstimateSubcategory } from "@/app/lib/estimates/types";
import type { EstimatePositionSection } from "@/app/lib/estimate-positions/types";

function cookieName(documentId: string): string {
  return `eb_estimate_collapsed_${documentId}`;
}

function parseCollapsedSectionIds(raw: string | null): Set<string> {
  if (!raw) {
    return new Set();
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return new Set();
    }

    return new Set(
      parsed.filter((entry): entry is string => typeof entry === "string"),
    );
  } catch {
    return new Set();
  }
}

export function readCollapsedSectionIds(documentId: string): Set<string> {
  return parseCollapsedSectionIds(readCookie(cookieName(documentId)));
}

export function writeCollapsedSectionIds(
  documentId: string,
  sectionIds: ReadonlySet<string>,
): void {
  writeCookie(cookieName(documentId), JSON.stringify([...sectionIds]));
}

export function collectVisibleSectionDragIds(
  sections: EstimatePositionSection[],
  collapsedSectionIds: ReadonlySet<string>,
): string[] {
  const ids: string[] = [];

  for (const section of sections) {
    ids.push(categoryDragId(section.id));

    if (collapsedSectionIds.has(section.id)) {
      continue;
    }

    for (const subcategory of section.subcategories) {
      ids.push(subcategoryDragId(subcategory.id));

      if (collapsedSectionIds.has(subcategory.id)) {
        continue;
      }

      for (const row of subcategory.items) {
        ids.push(itemDragId(getRowItemId(row)));
      }
    }

    for (const row of section.items) {
      ids.push(itemDragId(getRowItemId(row)));
    }
  }

  return ids;
}

export function getCollapsedSectionSummary(
  section: EstimatePositionSection,
): string {
  const subcategoryCount = section.subcategories.length;
  const itemCount =
    section.items.length +
    section.subcategories.reduce(
      (total, subcategory) => total + subcategory.items.length,
      0,
    );

  const parts: string[] = [];
  if (subcategoryCount > 0) {
    parts.push(
      subcategoryCount === 1 ? "1 apakškategorija" : `${subcategoryCount} apakškategorijas`,
    );
  }
  if (itemCount > 0) {
    parts.push(itemCount === 1 ? "1 pozīcija" : `${itemCount} pozīcijas`);
  }

  return parts.length > 0 ? parts.join(" · ") : "Sakļauts";
}

export function getCollapsedSubcategorySummary(
  subcategory: EstimateSubcategory,
): string {
  const itemCount = subcategory.items.length;

  if (itemCount === 0) {
    return "Sakļauts";
  }

  return itemCount === 1 ? "1 pozīcija" : `${itemCount} pozīcijas`;
}
