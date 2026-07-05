import { getRowItemId } from "@/app/lib/estimates/multi-position";
import type { EstimateCategory } from "@/app/lib/estimates/types";
import { rowItemLabel } from "@/app/lib/estimate-positions/sagatave-row-matching";

export type SagataveStructureIntroEntry = {
  nodeId: string;
  label: string;
  kind: "category" | "subcategory" | "position";
  categoryTitle?: string;
  subcategoryTitle?: string;
};

export function listSagataveStructureIntroEntries(
  categories: EstimateCategory[],
  nodeIds: readonly string[],
): SagataveStructureIntroEntry[] {
  const idSet = new Set(nodeIds);
  const entries: SagataveStructureIntroEntry[] = [];
  const seen = new Set<string>();

  for (const category of categories) {
    if (idSet.has(category.id) && !seen.has(category.id)) {
      seen.add(category.id);
      entries.push({
        nodeId: category.id,
        label: category.title.trim() || "—",
        kind: "category",
        categoryTitle: category.title,
      });
    }

    for (const subcategory of category.subcategories) {
      if (idSet.has(subcategory.id) && !seen.has(subcategory.id)) {
        seen.add(subcategory.id);
        entries.push({
          nodeId: subcategory.id,
          label: subcategory.title.trim() || "—",
          kind: "subcategory",
          categoryTitle: category.title,
          subcategoryTitle: subcategory.title,
        });
      }

      for (const row of subcategory.items) {
        const rowId = getRowItemId(row);
        if (idSet.has(rowId) && !seen.has(rowId)) {
          seen.add(rowId);
          entries.push({
            nodeId: rowId,
            label: rowItemLabel(row),
            kind: "position",
            categoryTitle: category.title,
            subcategoryTitle: subcategory.title,
          });
        }
      }
    }

    for (const row of category.items) {
      const rowId = getRowItemId(row);
      if (idSet.has(rowId) && !seen.has(rowId)) {
        seen.add(rowId);
        entries.push({
          nodeId: rowId,
          label: rowItemLabel(row),
          kind: "position",
          categoryTitle: category.title,
        });
      }
    }
  }

  return entries;
}
