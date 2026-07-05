import type { ExcludedPosition } from "@/app/lib/excluded-positions/types";

/**
 * Atjauno globālo secību, pārkārtojot tikai redzamās pozīcijas un saglabājot
 * paslēptās (noņemtās) pozīcijas to pašās vietās globālajā sarakstā.
 */
export function mergeExcludedPositionVisibleReorder(
  globalPositions: ExcludedPosition[],
  visibleIdsBefore: string[],
  visibleIdsAfter: string[],
): string[] {
  const globalIds = globalPositions.map((position) => position.id);

  if (visibleIdsBefore.join("\0") === visibleIdsAfter.join("\0")) {
    return globalIds;
  }

  const hiddenIdSet = new Set(
    globalIds.filter((id) => !visibleIdsBefore.includes(id)),
  );
  const result: string[] = [];
  let nextVisibleIndex = 0;

  for (const id of globalIds) {
    if (hiddenIdSet.has(id)) {
      result.push(id);
      continue;
    }

    const nextId = visibleIdsAfter[nextVisibleIndex];
    if (nextId) {
      result.push(nextId);
      nextVisibleIndex += 1;
    }
  }

  return result;
}
