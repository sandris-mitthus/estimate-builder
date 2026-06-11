import { createLineItem } from "@/app/lib/estimates/create-empty";
import type {
  EstimateCategory,
  EstimateLineItem,
  EstimateMultiPosition,
  EstimateMultiPositionOption,
  EstimateRowItem,
} from "@/app/lib/estimates/types";

export const MULTI_POSITION_NONE_OPTION_ID = "__none__";
export const MULTI_POSITION_NONE_LABEL = "Neviena opcija";

export function isEstimateMultiPosition(
  row: EstimateRowItem,
): row is EstimateMultiPosition {
  return "kind" in row && row.kind === "multi";
}

export function isEstimateLineItem(
  row: EstimateRowItem,
): row is EstimateLineItem {
  return !isEstimateMultiPosition(row);
}

export function getRowItemId(row: EstimateRowItem): string {
  return row.id;
}

function hasLineItemPrice(item: EstimateLineItem): boolean {
  return (
    item.unitPrice.labor > 0 ||
    item.unitPrice.materials > 0 ||
    item.unitPrice.mechanisms > 0
  );
}

export function isBlankLineItem(item: EstimateLineItem): boolean {
  return !item.name.trim() && !hasLineItemPrice(item);
}

export function createMultiPositionOption(): EstimateMultiPositionOption {
  return {
    id: crypto.randomUUID(),
    lineItem: createLineItem(),
  };
}

export function ensureTrailingEmptyMultiOption(
  options: EstimateMultiPositionOption[],
): EstimateMultiPositionOption[] {
  const last = options[options.length - 1];
  if (!last || !isBlankLineItem(last.lineItem)) {
    return [...options, createMultiPositionOption()];
  }

  return options;
}

export function createMultiPosition(name = ""): EstimateMultiPosition {
  return {
    id: crypto.randomUUID(),
    kind: "multi",
    name,
    options: [createMultiPositionOption()],
  };
}

function isMeaningfulMultiOptionLineItem(lineItem: EstimateLineItem): boolean {
  return Boolean(lineItem.name.trim()) || hasLineItemPrice(lineItem);
}

function deduplicateMultiPositionOptions(
  options: EstimateMultiPositionOption[],
): EstimateMultiPositionOption[] {
  const seen = new Set<string>();

  return options.filter((option) => {
    if (!isMeaningfulMultiOptionLineItem(option.lineItem)) {
      return true;
    }

    const key = getMultiOptionIdentityKey(option.lineItem);
    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

export function hasDuplicateMultiOptions(
  multi: EstimateMultiPosition,
): boolean {
  const seen = new Set<string>();

  for (const option of multi.options) {
    if (!isMeaningfulMultiOptionLineItem(option.lineItem)) {
      continue;
    }

    const key = getMultiOptionIdentityKey(option.lineItem);
    if (seen.has(key)) {
      return true;
    }

    seen.add(key);
  }

  return false;
}

export function wouldDuplicateMultiOption(
  draft: EstimateMultiPosition,
  currentOptionId: string,
  lineItem: EstimateLineItem,
): boolean {
  if (!isMeaningfulMultiOptionLineItem(lineItem)) {
    return false;
  }

  const excluded = getExcludedKeysForMultiOptionEdit(draft, currentOptionId);

  return excluded.has(getMultiOptionIdentityKey(lineItem));
}

export function normalizeMultiPosition(
  multi: EstimateMultiPosition,
): EstimateMultiPosition {
  const options = deduplicateMultiPositionOptions(
    multi.options
      .map((option) => ({
        ...option,
        lineItem: {
          ...option.lineItem,
          name: option.lineItem.name.trim(),
        },
      }))
      .filter(
        (option) =>
          option.lineItem.name.length > 0 || hasLineItemPrice(option.lineItem),
      ),
  );

  return {
    ...multi,
    kind: "multi",
    name: multi.name.trim(),
    options: options.length > 0 ? options : [createMultiPositionOption()],
    selectedOptionId: multi.selectedOptionId ?? null,
  };
}

export function normalizeRowItem(row: EstimateRowItem): EstimateRowItem {
  if (isEstimateMultiPosition(row)) {
    return normalizeMultiPosition(row);
  }

  return row;
}

export function isBlankMultiPosition(multi: EstimateMultiPosition): boolean {
  return (
    !multi.name.trim() &&
    multi.options.every((option) => isBlankLineItem(option.lineItem))
  );
}

export function isBlankRowItem(row: EstimateRowItem): boolean {
  if (isEstimateMultiPosition(row)) {
    return isBlankMultiPosition(row);
  }

  return isBlankLineItem(row);
}

export function getMultiOptionIdentityKey(lineItem: EstimateLineItem): string {
  if (lineItem.positionPriceId) {
    return `catalog:${lineItem.positionPriceId}`;
  }

  const name = lineItem.name.trim().toLocaleLowerCase("lv-LV");
  const unit = lineItem.unit.trim().toLocaleLowerCase("lv-LV");
  return `name:${name}|unit:${unit}`;
}

function collectSelectedMultiOptionKeysFromRows(
  rows: EstimateRowItem[],
  excludeMultiId?: string,
  keys = new Set<string>(),
): Set<string> {
  for (const row of rows) {
    if (!isEstimateMultiPosition(row) || row.id === excludeMultiId) {
      continue;
    }

    const selected = resolveSelectedMultiLineItem(row);
    if (selected) {
      keys.add(getMultiOptionIdentityKey(selected));
    }
  }

  return keys;
}

function collectDefinedMultiOptionKeysFromRows(
  rows: EstimateRowItem[],
  excludeMultiId?: string,
  keys = new Set<string>(),
): Set<string> {
  for (const row of rows) {
    if (!isEstimateMultiPosition(row) || row.id === excludeMultiId) {
      continue;
    }

    for (const option of row.options) {
      if (
        option.lineItem.name.trim() ||
        hasLineItemPrice(option.lineItem)
      ) {
        keys.add(getMultiOptionIdentityKey(option.lineItem));
      }
    }
  }

  return keys;
}

function collectMultiOptionKeysFromCategories(
  categories: EstimateCategory[],
  excludeMultiId: string | undefined,
  collectFromRows: (
    rows: EstimateRowItem[],
    excludeMultiId?: string,
    keys?: Set<string>,
  ) => Set<string>,
): Set<string> {
  const keys = new Set<string>();

  for (const category of categories) {
    collectFromRows(category.items, excludeMultiId, keys);

    for (const subcategory of category.subcategories) {
      collectFromRows(subcategory.items, excludeMultiId, keys);
    }
  }

  return keys;
}

export function collectSelectedMultiOptionKeys(
  categories: EstimateCategory[],
  excludeMultiId?: string,
): Set<string> {
  return collectMultiOptionKeysFromCategories(
    categories,
    excludeMultiId,
    collectSelectedMultiOptionKeysFromRows,
  );
}

export function collectDefinedMultiOptionKeys(
  categories: EstimateCategory[],
  excludeMultiId?: string,
): Set<string> {
  return collectMultiOptionKeysFromCategories(
    categories,
    excludeMultiId,
    collectDefinedMultiOptionKeysFromRows,
  );
}

/** Selected + defined options in other multi-pozīcijas (same estimate). */
export function collectReservedMultiOptionKeys(
  categories: EstimateCategory[],
  excludeMultiId?: string,
): Set<string> {
  const keys = collectDefinedMultiOptionKeys(categories, excludeMultiId);
  collectMultiOptionKeysFromCategories(
    categories,
    excludeMultiId,
    collectSelectedMultiOptionKeysFromRows,
  ).forEach((key) => keys.add(key));
  return keys;
}

export function getExcludedKeysForMultiOptionEdit(
  draft: EstimateMultiPosition,
  currentOptionId: string,
): Set<string> {
  const excluded = new Set<string>();

  for (const option of draft.options) {
    if (option.id === currentOptionId) {
      continue;
    }

    if (
      option.lineItem.name.trim() ||
      hasLineItemPrice(option.lineItem)
    ) {
      excluded.add(getMultiOptionIdentityKey(option.lineItem));
    }
  }

  const current = draft.options.find((entry) => entry.id === currentOptionId);
  if (
    current &&
    (current.lineItem.name.trim() || hasLineItemPrice(current.lineItem))
  ) {
    excluded.delete(getMultiOptionIdentityKey(current.lineItem));
  }

  return excluded;
}

export function getMultiPositionSelectionOptions(
  multi: EstimateMultiPosition,
  excludedKeys: ReadonlySet<string> = new Set(),
): Array<{ id: string; label: string }> {
  const userOptions = multi.options
    .filter(
      (option) =>
        !excludedKeys.has(getMultiOptionIdentityKey(option.lineItem)),
    )
    .map((option) => ({
      id: option.id,
      label: option.lineItem.name.trim() || "—",
    }));

  return [
    ...userOptions,
    {
      id: MULTI_POSITION_NONE_OPTION_ID,
      label: MULTI_POSITION_NONE_LABEL,
    },
  ];
}

export function resolveSelectedMultiLineItem(
  multi: EstimateMultiPosition,
): EstimateLineItem | null {
  const selectedId = multi.selectedOptionId;
  if (!selectedId || selectedId === MULTI_POSITION_NONE_OPTION_ID) {
    return null;
  }

  const option = multi.options.find((entry) => entry.id === selectedId);
  return option?.lineItem ?? null;
}

export function collectRowLineItems(
  rows: EstimateRowItem[],
  options?: { forTotals?: boolean },
): EstimateLineItem[] {
  const items: EstimateLineItem[] = [];

  for (const row of rows) {
    if (isEstimateLineItem(row)) {
      items.push(row);
      continue;
    }

    if (options?.forTotals) {
      const selected = resolveSelectedMultiLineItem(row);
      if (selected) {
        items.push(selected);
      }
      continue;
    }

    for (const option of row.options) {
      items.push(option.lineItem);
    }
  }

  return items;
}

export function updateRowItemById(
  rows: EstimateRowItem[],
  rowId: string,
  next: EstimateRowItem,
): EstimateRowItem[] {
  return rows.map((row) => (getRowItemId(row) === rowId ? next : row));
}

export function removeRowItemById(
  rows: EstimateRowItem[],
  rowId: string,
): EstimateRowItem[] {
  return rows.filter((row) => getRowItemId(row) !== rowId);
}
