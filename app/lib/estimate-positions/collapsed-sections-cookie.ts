import { readCookie, writeCookie } from "@/app/lib/client/cookies";
import {
  categoryDragId,
  itemDragId,
  subcategoryDragId,
} from "@/app/lib/estimates/drag-ids";
import { getRowItemId } from "@/app/lib/estimates/multi-position";
import type { EstimateSubcategory } from "@/app/lib/estimates/types";
import type { EstimatePositionSection } from "@/app/lib/estimate-positions/types";
import type { TranslationParams } from "@/app/lib/i18n/translations";

type Translate = (
  key: string,
  fallback?: string,
  params?: TranslationParams,
) => string;

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
  t: Translate,
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
      t("estimate.collapsed.subcategory_count", "{count} apakškategorijas", {
        count: subcategoryCount,
      }),
    );
  }
  if (itemCount > 0) {
    parts.push(t("estimate.collapsed.position_count", "{count} pozīcijas", {
      count: itemCount,
    }));
  }

  return parts.length > 0 ? parts.join(" · ") : t("estimate.collapsed.summary", "Sakļauts");
}

export function getCollapsedSubcategorySummary(
  subcategory: EstimateSubcategory,
  t: Translate,
): string {
  const itemCount = subcategory.items.length;

  if (itemCount === 0) {
    return t("estimate.collapsed.summary", "Sakļauts");
  }

  return t("estimate.collapsed.position_count", "{count} pozīcijas", {
    count: itemCount,
  });
}
