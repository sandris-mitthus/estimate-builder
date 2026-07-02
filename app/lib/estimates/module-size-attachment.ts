import {
  isEstimateLineItem,
  isEstimateMultiPosition,
} from "@/app/lib/estimates/multi-position";
import type {
  EstimateLineItem,
  EstimateRowItem,
  LineItemModuleSizeAttachment,
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

export function createLineItemModuleSizeAttachment(
  moduleId: string,
  itemKeys: string[],
  adjustments: Record<string, string> = {},
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
