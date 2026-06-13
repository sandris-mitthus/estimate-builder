import { addThousandSeparators, roundToTwoDecimals } from "@/app/lib/estimates/calculate-line";
import type { EstimateLineItem } from "@/app/lib/estimates/types";
import { findCatalogPositionForLineItem } from "@/app/lib/positions/sync-from-estimate-line-items";
import type { PositionPriceSummary } from "@/app/lib/positions/types";

export function roundQuantity(value: number): number {
  if (!Number.isFinite(value) || value < 0) {
    return 0;
  }

  return roundToTwoDecimals(value);
}

export function findCatalogPosition(
  positionPriceId: string | undefined,
  catalogPositions: PositionPriceSummary[],
): PositionPriceSummary | undefined {
  if (!positionPriceId) {
    return undefined;
  }

  return catalogPositions.find((position) => position.id === positionPriceId);
}

export function isVariableQuantityLineItem(
  item: EstimateLineItem,
  catalogPositions: PositionPriceSummary[],
): boolean {
  if (item.variableQuantity === true) {
    return true;
  }
  const position = findCatalogPositionForLineItem(item, catalogPositions);
  return position?.variableQuantity === true;
}

export function hasAnyVariableQuantityPosition(
  catalogPositions: PositionPriceSummary[],
): boolean {
  return catalogPositions.some((position) => position.variableQuantity);
}

/** Atļauj tikai ciparus un vienu decimālo atdalītāju (, vai .). */
export function sanitizeQuantityInputString(value: string): string {
  let result = "";
  let hasSeparator = false;

  for (const char of value) {
    if (char >= "0" && char <= "9") {
      result += char;
      continue;
    }

    if ((char === "." || char === ",") && !hasSeparator) {
      result += char;
      hasSeparator = true;
    }
  }

  return result;
}

export function parseQuantityInput(value: string): number {
  const normalized = value.trim().replace(",", ".");
  if (!normalized) {
    return 1;
  }

  const parsed = Number(normalized);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return 1;
  }

  return roundQuantity(parsed);
}

export function formatQuantityDisplay(value: number): string {
  if (!Number.isFinite(value) || value < 0) {
    return "";
  }

  return addThousandSeparators(roundQuantity(value).toFixed(2)).replace(".", ",");
}

/** Atļauj ciparus un vienu decimālo atdalītāju, max 2 cipari aiz komata. */
export function sanitizeTimeNormInputString(value: string): string {
  const sanitized = sanitizeQuantityInputString(value);
  const separatorIndex = sanitized.search(/[.,]/);
  if (separatorIndex === -1) {
    return sanitized;
  }

  const beforeSeparator = sanitized.slice(0, separatorIndex + 1);
  const afterSeparator = sanitized.slice(separatorIndex + 1).slice(0, 2);
  return beforeSeparator + afterSeparator;
}

export function parseTimeNormInput(value: string): number {
  const normalized = value.trim().replace(",", ".");
  if (!normalized) {
    return 0;
  }

  const parsed = Number(normalized);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0;
  }

  return roundQuantity(parsed);
}

export function formatTimeNormDisplay(value: number): string {
  if (!Number.isFinite(value) || value < 0) {
    return "";
  }

  return roundQuantity(value).toFixed(2).replace(".", ",");
}
