import { readCookie, writeCookie } from "@/app/lib/client/cookies";
import {
  categoryDragId,
  itemDragId,
  subcategoryDragId,
} from "@/app/lib/estimates/drag-ids";
import { resolveCategoryChildOrder } from "@/app/lib/estimates/category-child-order";
import {
  isEstimateCategoryHidden,
  isEstimateRowHidden,
  isEstimateSubcategoryHidden,
} from "@/app/lib/estimates/hidden-estimate-rows";
import { getRowItemId } from "@/app/lib/estimates/multi-position";
import type {
  EstimateCategory,
  EstimateSubcategory,
} from "@/app/lib/estimates/types";
import type { EstimatePositionSection } from "@/app/lib/estimate-positions/types";
import type { TranslationParams } from "@/app/lib/i18n/translations";

type Translate = (
  key: string,
  fallback?: string,
  params?: TranslationParams,
) => string;

export type CollapsedSectionSummaryParts = {
  subcategoryLine?: string;
  positionLine?: string;
  fallbackLine?: string;
};

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
  sections: EstimateCategory[] | EstimatePositionSection[],
  collapsedSectionIds: ReadonlySet<string>,
  options?: { includeHiddenRows?: boolean },
): string[] {
  const includeHiddenRows = options?.includeHiddenRows === true;
  const ids: string[] = [];

  for (const section of sections) {
    if (!includeHiddenRows && isEstimateCategoryHidden(section)) {
      continue;
    }

    ids.push(categoryDragId(section.id));

    if (collapsedSectionIds.has(section.id)) {
      continue;
    }

    for (const ref of resolveCategoryChildOrder(section)) {
      if (ref.kind === "subcategory") {
        const subcategory = section.subcategories.find(
          (entry) => entry.id === ref.id,
        );
        if (
          !subcategory ||
          (!includeHiddenRows && isEstimateSubcategoryHidden(subcategory))
        ) {
          continue;
        }

        ids.push(subcategoryDragId(ref.id));
        if (collapsedSectionIds.has(ref.id)) {
          continue;
        }

        for (const row of subcategory.items) {
          if (!includeHiddenRows && isEstimateRowHidden(row)) {
            continue;
          }

          ids.push(itemDragId(getRowItemId(row)));
        }
        continue;
      }

      const row = section.items.find((entry) => getRowItemId(entry) === ref.id);
      if (row && !includeHiddenRows && isEstimateRowHidden(row)) {
        continue;
      }

      ids.push(itemDragId(ref.id));
    }
  }

  return ids;
}

export function getCollapsedSectionSummaryParts(
  section: EstimatePositionSection | EstimateCategory,
  t: Translate,
): CollapsedSectionSummaryParts {
  const subcategoryCount = section.subcategories.length;
  const itemCount =
    section.items.length +
    section.subcategories.reduce(
      (total, subcategory) => total + subcategory.items.length,
      0,
    );

  if (subcategoryCount === 0 && itemCount === 0) {
    return {
      fallbackLine: t("estimate.collapsed.summary", "Sakļauts"),
    };
  }

  return {
    subcategoryLine:
      subcategoryCount > 0
        ? t("estimate.collapsed.subcategory_count", "{count} apakškategorijas", {
            count: subcategoryCount,
          })
        : undefined,
    positionLine:
      itemCount > 0
        ? t("estimate.collapsed.position_count", "{count} pozīcijas", {
            count: itemCount,
          })
        : undefined,
  };
}

export function getCollapsedSubcategorySummaryParts(
  subcategory: EstimateSubcategory,
  t: Translate,
): CollapsedSectionSummaryParts {
  const itemCount = subcategory.items.length;

  if (itemCount === 0) {
    return {
      fallbackLine: t("estimate.collapsed.summary", "Sakļauts"),
    };
  }

  return {
    positionLine: t("estimate.collapsed.position_count", "{count} pozīcijas", {
      count: itemCount,
    }),
  };
}

export function getCollapsedSectionSummary(
  section: EstimatePositionSection | EstimateCategory,
  t: Translate,
): string {
  const parts = getCollapsedSectionSummaryParts(section, t);
  const lines = [
    parts.subcategoryLine,
    parts.positionLine,
    parts.fallbackLine,
  ].filter(Boolean);

  return lines.length > 0
    ? lines.join(" · ")
    : t("estimate.collapsed.summary", "Sakļauts");
}

export function getCollapsedSubcategorySummary(
  subcategory: EstimateSubcategory,
  t: Translate,
): string {
  const parts = getCollapsedSubcategorySummaryParts(subcategory, t);
  return (
    parts.positionLine ??
    parts.fallbackLine ??
    t("estimate.collapsed.summary", "Sakļauts")
  );
}
