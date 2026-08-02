import {
  isEstimateLineItem,
  isEstimateMultiPosition,
} from "@/app/lib/estimates/multi-position";
import type {
  EstimateLineItem,
  EstimateRowItem,
  LineItemModuleSizeAttachment,
  ModuleSizeItemSign,
} from "@/app/lib/estimates/types";
import type { EstimatePositionSection } from "@/app/lib/estimate-positions/types";
import { hasModuleSizeAdjustment } from "@/app/lib/modules/module-size-value";

export type ModuleSizeAttachItemState = {
  enabled: boolean;
  adjustment: string;
};

export const defaultModuleSizeAttachItemState: ModuleSizeAttachItemState = {
  enabled: false,
  adjustment: "",
};

export function createAttachItemStateKey(
  moduleId: string,
  itemKey: string,
): string {
  return `${moduleId}:${itemKey}`;
}

export function parseAttachItemStateKey(stateKey: string): {
  moduleId: string;
  itemKey: string;
} {
  const colonIndex = stateKey.indexOf(":");
  if (colonIndex === -1) {
    return { moduleId: stateKey, itemKey: "" };
  }

  return {
    moduleId: stateKey.slice(0, colonIndex),
    itemKey: stateKey.slice(colonIndex + 1),
  };
}

export function getLineItemModuleSizeItemKeys(
  attachment: LineItemModuleSizeAttachment,
): string[] {
  const rawKeys =
    attachment.itemKeys && attachment.itemKeys.length > 0
      ? attachment.itemKeys
      : [attachment.itemKey];

  const uniqueKeys: string[] = [];
  for (const key of rawKeys) {
    if (
      typeof key === "string" &&
      key.trim().length > 0 &&
      !uniqueKeys.includes(key)
    ) {
      uniqueKeys.push(key);
    }
  }

  return uniqueKeys;
}

/**
 * Atgriež tikai atņemamās atslēgas. Pirmā piesaistītā atslēga vienmēr ir bāze (`+`),
 * tāpēc tai zīmi neglabā.
 */
function normalizeModuleSizeItemSigns(
  itemKeys: readonly string[],
  itemSigns: Record<string, ModuleSizeItemSign> | undefined,
): Record<string, ModuleSizeItemSign> | undefined {
  if (!itemSigns) {
    return undefined;
  }

  const normalized: Record<string, ModuleSizeItemSign> = {};
  for (const key of itemKeys.slice(1)) {
    if (itemSigns[key] === "-") {
      normalized[key] = "-";
    }
  }

  return Object.keys(normalized).length > 0 ? normalized : undefined;
}

export function getLineItemModuleSizeItemSigns(
  attachment: LineItemModuleSizeAttachment,
): Record<string, ModuleSizeItemSign> {
  return {
    ...normalizeModuleSizeItemSigns(
      getLineItemModuleSizeItemKeys(attachment),
      attachment.itemSigns,
    ),
  };
}

/** Atslēgas zīme kopsummā; pirmā piesaistītā atslēga vienmēr ir `+`. */
export function getLineItemModuleSizeItemSign(
  attachment: LineItemModuleSizeAttachment,
  itemKey: string,
): ModuleSizeItemSign {
  return getLineItemModuleSizeItemSigns(attachment)[itemKey] ?? "+";
}

function normalizeModuleSizeItemMultipliers(
  itemKeys: readonly string[],
  itemMultipliers: Record<string, number> | undefined,
): Record<string, number> | undefined {
  if (!itemMultipliers) {
    return undefined;
  }

  const normalized: Record<string, number> = {};
  for (const key of itemKeys) {
    const value = itemMultipliers[key];
    if (
      typeof value === "number" &&
      Number.isFinite(value) &&
      value > 1 &&
      value <= 99
    ) {
      normalized[key] = Math.round(value);
    }
  }

  return Object.keys(normalized).length > 0 ? normalized : undefined;
}

export function getLineItemModuleSizeItemMultipliers(
  attachment: LineItemModuleSizeAttachment,
): Record<string, number> {
  return {
    ...normalizeModuleSizeItemMultipliers(
      getLineItemModuleSizeItemKeys(attachment),
      attachment.itemMultipliers,
    ),
  };
}

/** Reizinātājs atslēgai; noklusējums 1. */
export function getLineItemModuleSizeItemMultiplier(
  attachment: LineItemModuleSizeAttachment,
  itemKey: string,
): number {
  return getLineItemModuleSizeItemMultipliers(attachment)[itemKey] ?? 1;
}

export function createLineItemModuleSizeAttachment(
  moduleId: string,
  itemKeys: string[],
  adjustments: Record<string, string> = {},
  itemSigns: Record<string, ModuleSizeItemSign> = {},
  itemMultipliers: Record<string, number> = {},
): LineItemModuleSizeAttachment | null {
  const uniqueKeys = getLineItemModuleSizeItemKeys({
    moduleId,
    itemKey: itemKeys[0] ?? "",
    itemKeys,
  });

  if (uniqueKeys.length === 0) {
    return null;
  }

  const normalizedAdjustments = Object.fromEntries(
    Object.entries(adjustments).filter(([, value]) =>
      hasModuleSizeAdjustment(value),
    ),
  );

  return {
    moduleId,
    itemKey: uniqueKeys[0],
    itemKeys: uniqueKeys,
    itemSigns: normalizeModuleSizeItemSigns(uniqueKeys, itemSigns),
    itemMultipliers: normalizeModuleSizeItemMultipliers(
      uniqueKeys,
      itemMultipliers,
    ),
    adjustments:
      Object.keys(normalizedAdjustments).length > 0
        ? normalizedAdjustments
        : undefined,
  };
}

export function normalizeLineItemModuleSizeAttachment(
  value: unknown,
): LineItemModuleSizeAttachment | undefined {
  if (!value || typeof value !== "object") {
    return undefined;
  }

  const record = value as {
    moduleId?: unknown;
    itemKey?: unknown;
    itemKeys?: unknown;
    itemSigns?: unknown;
    itemMultipliers?: unknown;
    adjustment?: unknown;
    adjustments?: unknown;
  };

  if (typeof record.moduleId !== "string" || record.moduleId.trim().length === 0) {
    return undefined;
  }

  let itemKeys: string[] = [];
  if (Array.isArray(record.itemKeys)) {
    itemKeys = record.itemKeys.filter(
      (key): key is string => typeof key === "string" && key.trim().length > 0,
    );
  }
  if (
    itemKeys.length === 0 &&
    typeof record.itemKey === "string" &&
    record.itemKey.trim().length > 0
  ) {
    itemKeys = [record.itemKey];
  }

  if (itemKeys.length === 0) {
    return undefined;
  }

  const uniqueKeys = [...new Set(itemKeys)];

  const itemSigns: Record<string, ModuleSizeItemSign> = {};
  if (record.itemSigns && typeof record.itemSigns === "object") {
    for (const [key, entry] of Object.entries(
      record.itemSigns as Record<string, unknown>,
    )) {
      if (entry === "-") {
        itemSigns[key] = "-";
      }
    }
  }

  const itemMultipliers: Record<string, number> = {};
  if (record.itemMultipliers && typeof record.itemMultipliers === "object") {
    for (const [key, entry] of Object.entries(
      record.itemMultipliers as Record<string, unknown>,
    )) {
      if (typeof entry === "number" && Number.isFinite(entry) && entry > 1) {
        itemMultipliers[key] = entry;
      }
    }
  }

  const adjustments: Record<string, string> = {};

  if (record.adjustments && typeof record.adjustments === "object") {
    for (const [key, entry] of Object.entries(
      record.adjustments as Record<string, unknown>,
    )) {
      if (typeof entry === "string" && hasModuleSizeAdjustment(entry)) {
        adjustments[key] = entry;
      }
    }
  }

  const primaryItemKey = uniqueKeys[0];
  if (
    typeof record.adjustment === "string" &&
    hasModuleSizeAdjustment(record.adjustment)
  ) {
    adjustments[primaryItemKey] = record.adjustment;
  }

  return createLineItemModuleSizeAttachment(
    record.moduleId,
    uniqueKeys,
    adjustments,
    itemSigns,
    itemMultipliers,
  ) ?? undefined;
}

export function getLineItemModuleSizeAdjustments(
  attachment: LineItemModuleSizeAttachment,
): Record<string, string> {
  return { ...(attachment.adjustments ?? {}) };
}

function mapLineItemInRowItem(
  row: EstimateRowItem,
  lineItemId: string,
  updater: (item: EstimateLineItem) => EstimateLineItem,
): EstimateRowItem {
  if (isEstimateLineItem(row)) {
    return row.id === lineItemId ? updater(row) : row;
  }

  if (!isEstimateMultiPosition(row)) {
    return row;
  }

  return {
    ...row,
    options: row.options.map((option) =>
      option.lineItem.id === lineItemId
        ? { ...option, lineItem: updater(option.lineItem) }
        : option,
    ),
  };
}

function mapLineItemsInRows(
  rows: EstimateRowItem[],
  lineItemId: string,
  updater: (item: EstimateLineItem) => EstimateLineItem,
): EstimateRowItem[] {
  return rows.map((row) => mapLineItemInRowItem(row, lineItemId, updater));
}

export function findLineItemInSections(
  sections: EstimatePositionSection[],
  lineItemId: string,
): EstimateLineItem | null {
  for (const section of sections) {
    for (const row of section.items) {
      if (isEstimateLineItem(row) && row.id === lineItemId) {
        return row;
      }

      if (isEstimateMultiPosition(row)) {
        const option = row.options.find(
          (entry) => entry.lineItem.id === lineItemId,
        );
        if (option) {
          return option.lineItem;
        }
      }
    }

    for (const subcategory of section.subcategories) {
      for (const row of subcategory.items) {
        if (isEstimateLineItem(row) && row.id === lineItemId) {
          return row;
        }

        if (isEstimateMultiPosition(row)) {
          const option = row.options.find(
            (entry) => entry.lineItem.id === lineItemId,
          );
          if (option) {
            return option.lineItem;
          }
        }
      }
    }
  }

  return null;
}

export function updateLineItemModuleSizeAttachmentInSections(
  sections: EstimatePositionSection[],
  lineItemId: string,
  attachment: LineItemModuleSizeAttachment | null,
): EstimatePositionSection[] {
  const updater = (item: EstimateLineItem): EstimateLineItem => ({
    ...item,
    moduleSizeAttachment: attachment ?? undefined,
  });

  return sections.map((section) => ({
    ...section,
    items: mapLineItemsInRows(section.items, lineItemId, updater),
    subcategories: section.subcategories.map((subcategory) => ({
      ...subcategory,
      items: mapLineItemsInRows(subcategory.items, lineItemId, updater),
    })),
  }));
}

export function lineItemModuleSizeAttachmentToAttachState(
  attachment: LineItemModuleSizeAttachment | null | undefined,
): Record<string, ModuleSizeAttachItemState> {
  if (!attachment) {
    return {};
  }

  const enabledKeys = new Set(getLineItemModuleSizeItemKeys(attachment));
  const state: Record<string, ModuleSizeAttachItemState> = {};

  for (const [itemKey, adjustment] of Object.entries(
    getLineItemModuleSizeAdjustments(attachment),
  )) {
    const stateKey = createAttachItemStateKey(attachment.moduleId, itemKey);
    state[stateKey] = {
      enabled: enabledKeys.has(itemKey),
      adjustment,
    };
  }

  for (const itemKey of enabledKeys) {
    const stateKey = createAttachItemStateKey(attachment.moduleId, itemKey);
    if (!state[stateKey]) {
      state[stateKey] = { enabled: true, adjustment: "" };
    } else {
      state[stateKey] = {
        ...state[stateKey],
        enabled: true,
      };
    }
  }

  return state;
}
