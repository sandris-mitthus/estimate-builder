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

export function normalizeLineItemModuleSizeAttachment(
  value: unknown,
): LineItemModuleSizeAttachment | undefined {
  if (!value || typeof value !== "object") {
    return undefined;
  }

  const record = value as {
    moduleId?: unknown;
    itemKey?: unknown;
    adjustment?: unknown;
    adjustments?: unknown;
  };

  if (
    typeof record.moduleId !== "string" ||
    typeof record.itemKey !== "string" ||
    record.moduleId.trim().length === 0 ||
    record.itemKey.trim().length === 0
  ) {
    return undefined;
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

  if (
    typeof record.adjustment === "string" &&
    hasModuleSizeAdjustment(record.adjustment)
  ) {
    adjustments[record.itemKey] = record.adjustment;
  }

  return {
    moduleId: record.moduleId,
    itemKey: record.itemKey,
    adjustments,
  };
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

  const attachedStateKey = createAttachItemStateKey(
    attachment.moduleId,
    attachment.itemKey,
  );
  const state: Record<string, ModuleSizeAttachItemState> = {};

  for (const [itemKey, adjustment] of Object.entries(
    getLineItemModuleSizeAdjustments(attachment),
  )) {
    const stateKey = createAttachItemStateKey(attachment.moduleId, itemKey);
    state[stateKey] = {
      enabled: stateKey === attachedStateKey,
      adjustment,
    };
  }

  if (!state[attachedStateKey]) {
    state[attachedStateKey] = { enabled: true, adjustment: "" };
  } else {
    state[attachedStateKey] = {
      ...state[attachedStateKey],
      enabled: true,
    };
  }

  return state;
}
