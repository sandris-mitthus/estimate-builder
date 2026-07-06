import type { PositionPriceSummary } from "@/app/lib/positions/types";

/** Vai katalogs hintiem ir atšķirīgs (jauni/ laboti ieraksti). */
export function catalogPositionsDiffer(
  current: ReadonlyArray<PositionPriceSummary>,
  next: ReadonlyArray<PositionPriceSummary>,
): boolean {
  if (current.length !== next.length) {
    return true;
  }

  const currentById = new Map(current.map((position) => [position.id, position]));

  for (const position of next) {
    const existing = currentById.get(position.id);
    if (!existing) {
      return true;
    }

    if (
      existing.name !== position.name ||
      existing.unit !== position.unit ||
      existing.costType !== position.costType ||
      existing.variableQuantity !== position.variableQuantity ||
      existing.unitPrice !== position.unitPrice
    ) {
      return true;
    }
  }

  return false;
}
