import {
  isEstimateLineItem,
  isEstimateMultiPosition,
} from "@/app/lib/estimates/multi-position";
import type {
  EstimateLineItem,
  EstimateRowItem,
} from "@/app/lib/estimates/types";

export function normalizeRowTitle(title: string): string {
  return title.trim().toLowerCase();
}

export function rowItemLabel(row: EstimateRowItem): string {
  return row.name;
}

export function sameRowKind(a: EstimateRowItem, b: EstimateRowItem): boolean {
  return isEstimateMultiPosition(a) === isEstimateMultiPosition(b);
}

export function lineItemsCorrespond(
  a: EstimateLineItem,
  b: EstimateLineItem,
): boolean {
  if (normalizeRowTitle(a.name) === normalizeRowTitle(b.name)) {
    return true;
  }

  const leftId = a.positionPriceId?.trim();
  const rightId = b.positionPriceId?.trim();
  return Boolean(leftId && rightId && leftId === rightId);
}

/**
 * Vai divas rindas atbilst vienai un tai pašai sagataves / projekta pozīcijai.
 */
export function rowsCorrespond(a: EstimateRowItem, b: EstimateRowItem): boolean {
  if (!sameRowKind(a, b)) {
    return false;
  }

  if (normalizeRowTitle(rowItemLabel(a)) === normalizeRowTitle(rowItemLabel(b))) {
    return true;
  }

  if (isEstimateLineItem(a) && isEstimateLineItem(b)) {
    return lineItemsCorrespond(a, b);
  }

  return false;
}

function findRowByCorrespondence(
  items: EstimateRowItem[],
  target: EstimateRowItem,
): EstimateRowItem | undefined {
  return items.find((row) => rowsCorrespond(row, target));
}

/**
 * Atrod projekta rindu, kas atbilst sagataves rindai (nevis jaunu pozīciju).
 */
export function findProjectRowForSagataveRow(
  projectItems: EstimateRowItem[],
  sagataveRow: EstimateRowItem,
  rowIndex: number,
  sagataveItemCount: number,
): EstimateRowItem | undefined {
  const byIndex = projectItems[rowIndex];
  if (byIndex && rowsCorrespond(byIndex, sagataveRow)) {
    return byIndex;
  }

  const byCorrespondence = findRowByCorrespondence(projectItems, sagataveRow);
  if (byCorrespondence) {
    return byCorrespondence;
  }

  if (
    byIndex &&
    sameRowKind(byIndex, sagataveRow) &&
    projectItems.length === sagataveItemCount
  ) {
    return byIndex;
  }

  return undefined;
}

/**
 * Atrod sagataves rindu, kas atbilst projekta rindai.
 */
export function findSagataveRowForProjectRow(
  sagataveItems: EstimateRowItem[],
  projectRow: EstimateRowItem,
  rowIndex: number,
  projectItemCount: number,
): EstimateRowItem | undefined {
  const byIndex = sagataveItems[rowIndex];
  if (byIndex && rowsCorrespond(byIndex, projectRow)) {
    return byIndex;
  }

  const byCorrespondence = findRowByCorrespondence(sagataveItems, projectRow);
  if (byCorrespondence) {
    return byCorrespondence;
  }

  if (
    byIndex &&
    sameRowKind(byIndex, projectRow) &&
    sagataveItems.length === projectItemCount
  ) {
    return byIndex;
  }

  return undefined;
}

export function findCorrespondingOptionLineItems(
  sagataveOptions: { lineItem: EstimateLineItem }[],
  projectOptions: { lineItem: EstimateLineItem }[],
  optionIndex: number,
): {
  sagataveLineItem?: EstimateLineItem;
  projectLineItem?: EstimateLineItem;
} {
  const sagataveLineItem = sagataveOptions[optionIndex]?.lineItem;
  const projectLineItem = projectOptions[optionIndex]?.lineItem;

  if (!sagataveLineItem || !projectLineItem) {
    return { sagataveLineItem, projectLineItem };
  }

  if (lineItemsCorrespond(sagataveLineItem, projectLineItem)) {
    return { sagataveLineItem, projectLineItem };
  }

  const matchedProjectOption = projectOptions.find((option) =>
    lineItemsCorrespond(option.lineItem, sagataveLineItem),
  );
  if (matchedProjectOption) {
    return {
      sagataveLineItem,
      projectLineItem: matchedProjectOption.lineItem,
    };
  }

  if (
    sagataveOptions.length === projectOptions.length &&
    sagataveLineItem &&
    projectLineItem
  ) {
    return { sagataveLineItem, projectLineItem };
  }

  return { sagataveLineItem, projectLineItem };
}
