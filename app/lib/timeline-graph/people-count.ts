export const TIMELINE_GRAPH_PEOPLE_COUNT_MIN = 1;
export const TIMELINE_GRAPH_PEOPLE_COUNT_MAX = 99;

export function normalizeTimelineGraphPeopleCount(
  value: number | null | undefined,
): number {
  if (value == null || !Number.isFinite(value)) {
    return TIMELINE_GRAPH_PEOPLE_COUNT_MIN;
  }

  return Math.min(
    TIMELINE_GRAPH_PEOPLE_COUNT_MAX,
    Math.max(TIMELINE_GRAPH_PEOPLE_COUNT_MIN, Math.round(value)),
  );
}

export function timelineGraphPeopleCountKey(
  projectId: string,
  sectionId: string,
): string {
  // Projekta id obligāti atslēgā — citādi vienādi section id dažādos projektos sajauktos.
  return `${projectId}::${sectionId}`;
}
