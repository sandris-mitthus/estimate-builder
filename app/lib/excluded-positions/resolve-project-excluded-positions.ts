import type { ExcludedPosition } from "@/app/lib/excluded-positions/types";

export function normalizeExcludedPositionOmissions(
  value: unknown,
): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(
    (entry): entry is string => typeof entry === "string" && entry.trim().length > 0,
  );
}

export function resolveProjectExcludedPositions(
  globalPositions: ExcludedPosition[],
  omittedIds: string[] | undefined,
): ExcludedPosition[] {
  const omitted = new Set(normalizeExcludedPositionOmissions(omittedIds));
  if (omitted.size === 0) {
    return globalPositions;
  }

  return globalPositions.filter((position) => !omitted.has(position.id));
}

export function countOmittedExcludedPositions(
  globalPositions: ExcludedPosition[],
  omittedIds: string[] | undefined,
): number {
  const omitted = new Set(normalizeExcludedPositionOmissions(omittedIds));
  if (omitted.size === 0) {
    return 0;
  }

  return globalPositions.filter((position) => omitted.has(position.id)).length;
}
