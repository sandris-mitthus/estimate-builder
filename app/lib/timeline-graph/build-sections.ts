import { resolveCategoryChildren } from "@/app/lib/estimates/category-child-order";
import { calculateRowsVolumeTotals } from "@/app/lib/estimates/calculate-section-volume-totals";
import { getRowItemId } from "@/app/lib/estimates/multi-position";
import type {
  EstimateCategory,
  EstimateRowItem,
} from "@/app/lib/estimates/types";
import type { BuildingModuleSizeOption } from "@/app/lib/modules/types";
import type { PositionPriceSummary } from "@/app/lib/positions/types";
import { normalizeTimelineGraphPeopleCount } from "@/app/lib/timeline-graph/people-count";
import type {
  TimelineGraphCategory,
  TimelineGraphChildSection,
} from "@/app/lib/timeline-graph/types";

type BuildOptions = {
  catalogPositions: PositionPriceSummary[];
  moduleSizeOptions: BuildingModuleSizeOption[];
};

function workloadForRows(
  rows: EstimateRowItem[],
  options: BuildOptions,
): number {
  if (rows.length === 0) {
    return 0;
  }

  return (
    calculateRowsVolumeTotals(rows, {
      catalogPositions: options.catalogPositions,
      defaultHourlyRate: null,
      moduleSizeOptions: options.moduleSizeOptions,
    }).laborWorkloadHours ?? 0
  );
}

/**
 * Tāmes kategorijas ar apakšrindām (tiešās pozīcijas / subkategorijas).
 * Sākumā UI rāda tikai kategorijas; bērnus var izvērst.
 */
export function buildTimelineGraphCategories(
  categories: EstimateCategory[],
  options: BuildOptions,
): TimelineGraphCategory[] {
  const result: TimelineGraphCategory[] = [];

  for (const category of categories) {
    if (category.hiddenInEstimate) {
      continue;
    }

    const categoryTitle = category.title.trim() || "—";
    const children: TimelineGraphChildSection[] = [];
    let pendingDirectItems: EstimateRowItem[] = [];

    const flushDirectItems = () => {
      if (pendingDirectItems.length === 0) {
        return;
      }

      const batch = pendingDirectItems;
      pendingDirectItems = [];
      const hours = workloadForRows(batch, options);
      if (hours <= 0) {
        return;
      }

      children.push({
        id: `${category.id}:direct:${getRowItemId(batch[0]!)}`,
        kind: "direct",
        /** UI tulko kā „Pozīcijas” — tiešās kategorijas pozīcijas. */
        title: "",
        laborWorkloadHours: hours,
        peopleCount: normalizeTimelineGraphPeopleCount(1),
      });
    };

    for (const child of resolveCategoryChildren(category)) {
      if (child.kind === "item") {
        pendingDirectItems.push(child.row);
        continue;
      }

      flushDirectItems();

      if (child.subcategory.hiddenInEstimate) {
        continue;
      }

      const hours = workloadForRows(child.subcategory.items, options);
      if (hours <= 0) {
        continue;
      }

      children.push({
        id: child.subcategory.id,
        kind: "subcategory",
        title: child.subcategory.title.trim() || "—",
        laborWorkloadHours: hours,
        peopleCount: normalizeTimelineGraphPeopleCount(1),
      });
    }

    flushDirectItems();

    const laborWorkloadHours = children.reduce(
      (sum, entry) => sum + entry.laborWorkloadHours,
      0,
    );

    if (laborWorkloadHours <= 0 && children.length === 0) {
      continue;
    }

    result.push({
      id: category.id,
      title: categoryTitle,
      laborWorkloadHours,
      peopleCount: normalizeTimelineGraphPeopleCount(1),
      children,
    });
  }

  return result;
}
