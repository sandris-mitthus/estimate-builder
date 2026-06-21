import {
  isEstimateMultiPosition,
  removeRowItemById,
} from "@/app/lib/estimates/multi-position";
import type {
  EstimateCategory,
  EstimateMultiPosition,
  EstimateMultiPositionOption,
  EstimateRowItem,
  MultiOptionLinkGroup,
} from "@/app/lib/estimates/types";
import type { TranslationParams } from "@/app/lib/i18n/translations";

type Translate = (
  key: string,
  fallback?: string,
  params?: TranslationParams,
) => string;

export const MULTI_OPTION_LINK_DRAG_MIME =
  "application/x-estimate-multi-option-link";

export type { MultiOptionLinkGroup };

export type LinkedOptionSummary = {
  optionId: string;
  multiName: string;
  optionLabel: string;
};

export type MultiOptionContext = {
  multiId: string;
  multiName: string;
  option: EstimateMultiPositionOption;
};

function hasLineItemPrice(
  item: EstimateMultiPositionOption["lineItem"],
): boolean {
  return (
    item.unitPrice.labor > 0 ||
    item.unitPrice.materials > 0 ||
    item.unitPrice.mechanisms > 0
  );
}

export function isLinkableMultiOption(
  option: EstimateMultiPositionOption,
): boolean {
  return Boolean(option.lineItem.name.trim()) || hasLineItemPrice(option.lineItem);
}

export function findMultiById(
  categories: EstimateCategory[],
  multiId: string,
): EstimateMultiPosition | null {
  for (const category of categories) {
    for (const row of category.items) {
      if (isEstimateMultiPosition(row) && row.id === multiId) {
        return row;
      }
    }

    for (const subcategory of category.subcategories) {
      for (const row of subcategory.items) {
        if (isEstimateMultiPosition(row) && row.id === multiId) {
          return row;
        }
      }
    }
  }

  return null;
}

export function collectMultiOptionContexts(
  categories: EstimateCategory[],
  t?: Translate,
): MultiOptionContext[] {
  const result: MultiOptionContext[] = [];

  function collectFromRows(rows: EstimateRowItem[]) {
    for (const row of rows) {
      if (!isEstimateMultiPosition(row)) {
        continue;
      }

      const multiName =
        row.name.trim() ||
        (t ? t("estimate.multi.fallback_name", "Multi-pozīcija") : "Multi-pozīcija");
      for (const option of row.options) {
        if (!isLinkableMultiOption(option)) {
          continue;
        }

        result.push({
          multiId: row.id,
          multiName,
          option,
        });
      }
    }
  }

  for (const category of categories) {
    collectFromRows(category.items);
    for (const subcategory of category.subcategories) {
      collectFromRows(subcategory.items);
    }
  }

  return result;
}

export function findMultiIdForOption(
  categories: EstimateCategory[],
  optionId: string,
): string | null {
  for (const entry of collectMultiOptionContexts(categories)) {
    if (entry.option.id === optionId) {
      return entry.multiId;
    }
  }

  return null;
}

function findLinkGroupIndex(
  links: MultiOptionLinkGroup[],
  optionId: string,
): number {
  return links.findIndex((group) => group.optionIds.includes(optionId));
}

export function getLinkedOptionSummaries(
  categories: EstimateCategory[],
  links: MultiOptionLinkGroup[],
  optionId: string,
  t?: Translate,
): LinkedOptionSummary[] {
  const groupIndex = findLinkGroupIndex(links, optionId);
  if (groupIndex < 0) {
    return [];
  }

  const group = links[groupIndex];
  const contexts = new Map(
    collectMultiOptionContexts(categories, t).map((entry) => [
      entry.option.id,
      entry,
    ]),
  );

  return group.optionIds
    .filter((id) => id !== optionId)
    .map((id) => {
      const context = contexts.get(id);
      return {
        optionId: id,
        multiName:
          context?.multiName ??
          (t ? t("estimate.multi.fallback_name", "Multi-pozīcija") : "Multi-pozīcija"),
        optionLabel: context?.option.lineItem.name.trim() || "—",
      };
    });
}

function mergeOptionIdsIntoGroup(
  links: MultiOptionLinkGroup[],
  sourceOptionId: string,
  targetOptionId: string,
): MultiOptionLinkGroup[] {
  const sourceIndex = findLinkGroupIndex(links, sourceOptionId);
  const targetIndex = findLinkGroupIndex(links, targetOptionId);

  if (sourceIndex >= 0 && targetIndex >= 0 && sourceIndex === targetIndex) {
    return links;
  }

  const memberIds = new Set<string>([sourceOptionId, targetOptionId]);

  if (sourceIndex >= 0) {
    for (const id of links[sourceIndex].optionIds) {
      memberIds.add(id);
    }
  }

  if (targetIndex >= 0 && targetIndex !== sourceIndex) {
    for (const id of links[targetIndex].optionIds) {
      memberIds.add(id);
    }
  }

  const mergedGroup: MultiOptionLinkGroup = {
    id:
      (sourceIndex >= 0 ? links[sourceIndex].id : null) ??
      (targetIndex >= 0 ? links[targetIndex].id : null) ??
      crypto.randomUUID(),
    optionIds: [...memberIds],
  };

  const next = links.filter(
    (_, index) => index !== sourceIndex && index !== targetIndex,
  );
  next.push(mergedGroup);
  return next;
}

export function linkMultiOptions(
  categories: EstimateCategory[],
  links: MultiOptionLinkGroup[],
  sourceOptionId: string,
  targetOptionId: string,
): MultiOptionLinkGroup[] {
  if (sourceOptionId === targetOptionId) {
    return links;
  }

  const sourceMultiId = findMultiIdForOption(categories, sourceOptionId);
  const targetMultiId = findMultiIdForOption(categories, targetOptionId);
  if (!sourceMultiId || !targetMultiId || sourceMultiId === targetMultiId) {
    return links;
  }

  return mergeOptionIdsIntoGroup(links, sourceOptionId, targetOptionId);
}

export function unlinkMultiOptions(
  links: MultiOptionLinkGroup[],
  sourceOptionId: string,
  targetOptionId: string,
): MultiOptionLinkGroup[] {
  const groupIndex = findLinkGroupIndex(links, sourceOptionId);
  if (groupIndex < 0) {
    return links;
  }

  const group = links[groupIndex];
  if (!group.optionIds.includes(targetOptionId)) {
    return links;
  }

  const remainingIds = group.optionIds.filter((id) => id !== targetOptionId);

  if (remainingIds.length <= 1) {
    return links.filter((_, index) => index !== groupIndex);
  }

  return links.map((entry, index) =>
    index === groupIndex ? { ...entry, optionIds: remainingIds } : entry,
  );
}

export function cleanupLinksAfterOptionRemoval(
  links: MultiOptionLinkGroup[],
  optionIds: string[],
): MultiOptionLinkGroup[] {
  const removeSet = new Set(optionIds);

  return links
    .map((group) => ({
      ...group,
      optionIds: group.optionIds.filter((id) => !removeSet.has(id)),
    }))
    .filter((group) => group.optionIds.length >= 2);
}

export function cleanupLinksAfterMultiDelete(
  links: MultiOptionLinkGroup[],
  multi: EstimateMultiPosition,
): MultiOptionLinkGroup[] {
  return cleanupLinksAfterOptionRemoval(
    links,
    multi.options.map((option) => option.id),
  );
}

function mapRowItems(
  rows: EstimateRowItem[],
  updater: (multi: EstimateMultiPosition) => EstimateMultiPosition,
  predicate: (multi: EstimateMultiPosition) => boolean,
): EstimateRowItem[] {
  return rows.map((row) =>
    isEstimateMultiPosition(row) && predicate(row) ? updater(row) : row,
  );
}

function updateMultiInCategories(
  categories: EstimateCategory[],
  multiId: string,
  updater: (multi: EstimateMultiPosition) => EstimateMultiPosition,
): EstimateCategory[] {
  return categories.map((category) => ({
    ...category,
    items: mapRowItems(
      category.items,
      updater,
      (multi) => multi.id === multiId,
    ),
    subcategories: category.subcategories.map((subcategory) => ({
      ...subcategory,
      items: mapRowItems(
        subcategory.items,
        updater,
        (multi) => multi.id === multiId,
      ),
    })),
  }));
}

export function applyLinkedSelectionToCategories(
  categories: EstimateCategory[],
  links: MultiOptionLinkGroup[],
  changedMultiId: string,
  changedMulti: EstimateMultiPosition,
): EstimateCategory[] {
  let next = updateMultiInCategories(
    categories,
    changedMultiId,
    () => changedMulti,
  );

  const selectedOptionId = changedMulti.selectedOptionId ?? null;
  const changedMultiOptionIds = new Set(
    changedMulti.options.map((option) => option.id),
  );

  if (!selectedOptionId) {
    for (const group of links) {
      if (!group.optionIds.some((id) => changedMultiOptionIds.has(id))) {
        continue;
      }

      for (const optionId of group.optionIds) {
        const parentMultiId = findMultiIdForOption(next, optionId);
        if (!parentMultiId) {
          continue;
        }

        next = updateMultiInCategories(next, parentMultiId, (multi) => {
          if (!multi.selectedOptionId) {
            return multi;
          }

          return {
            ...multi,
            selectedOptionId: null,
          };
        });
      }
    }

    return next;
  }

  const groupIndex = findLinkGroupIndex(links, selectedOptionId);
  if (groupIndex < 0) {
    return next;
  }

  const group = links[groupIndex];

  for (const optionId of group.optionIds) {
    if (optionId === selectedOptionId) {
      continue;
    }

    const parentMultiId = findMultiIdForOption(next, optionId);
    if (!parentMultiId) {
      continue;
    }

    next = updateMultiInCategories(next, parentMultiId, (multi) => {
      if (multi.selectedOptionId === optionId) {
        return multi;
      }

      return {
        ...multi,
        selectedOptionId: optionId,
      };
    });
  }

  return next;
}

export function removeMultiFromCategories(
  categories: EstimateCategory[],
  multiId: string,
): EstimateCategory[] {
  return categories.map((category) => ({
    ...category,
    items: removeRowItemById(category.items, multiId),
    subcategories: category.subcategories.map((subcategory) => ({
      ...subcategory,
      items: removeRowItemById(subcategory.items, multiId),
    })),
  }));
}

export type MultiOptionLinkActions = {
  linkDragSourceOptionId: string | null;
  onLinkDragStart: (optionId: string) => void;
  onLinkDragEnd: () => void;
  getLinkedOptions: (optionId: string) => LinkedOptionSummary[];
  onLinkDrop: (sourceOptionId: string, targetOptionId: string) => void;
  onUnlink: (sourceOptionId: string, targetOptionId: string) => void;
  onMultiChange: (
    multiId: string,
    next: EstimateMultiPosition,
    syncSelection: boolean,
  ) => void;
  onMultiDelete: (multiId: string) => void;
};

export function applyMultiChangeWithLinkSync(
  categories: EstimateCategory[],
  links: MultiOptionLinkGroup[],
  changedMultiId: string,
  nextMulti: EstimateMultiPosition,
  syncSelection: boolean,
): EstimateCategory[] {
  if (!syncSelection) {
    return updateMultiInCategories(categories, changedMultiId, () => nextMulti);
  }

  return applyLinkedSelectionToCategories(
    categories,
    links,
    changedMultiId,
    nextMulti,
  );
}

export function parseMultiOptionLinks(value: unknown): MultiOptionLinkGroup[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => {
      if (!entry || typeof entry !== "object") {
        return null;
      }

      const record = entry as { id?: unknown; optionIds?: unknown };
      if (typeof record.id !== "string" || !Array.isArray(record.optionIds)) {
        return null;
      }

      const optionIds = record.optionIds.filter(
        (id): id is string => typeof id === "string",
      );

      if (optionIds.length < 2) {
        return null;
      }

      return {
        id: record.id,
        optionIds: [...new Set(optionIds)],
      };
    })
    .filter((group): group is MultiOptionLinkGroup => group != null);
}
