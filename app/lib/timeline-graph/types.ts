import type { ProjectStatus } from "@/app/lib/projects/project-status";

/** Apakšrinda zem kategorijas — tiešās pozīcijas vai subkategorija. */
export type TimelineGraphChildSection = {
  id: string;
  kind: "direct" | "subcategory";
  title: string;
  laborWorkloadHours: number;
};

/** Kategorija ar kopējo darbietilpību un izvēršamiem bērniem. */
export type TimelineGraphCategory = {
  id: string;
  title: string;
  laborWorkloadHours: number;
  children: TimelineGraphChildSection[];
};

export type TimelineGraphProject = {
  id: string;
  name: string;
  address: string;
  status: ProjectStatus;
  /** Darbietilpība no līguma tāmes (apjoms × laika norma), stundās. */
  laborWorkloadHours: number;
  categories: TimelineGraphCategory[];
};

/** Apstiprināts vai pabeigts — spilgta josla; citādi aptuvenais (blāvais) skats. */
export function isTimelineGraphConfirmedStatus(status: ProjectStatus): boolean {
  return status === "approved" || status === "completed";
}

/** Projektu statusi, kas rādās laika grafikā (bez noraidītajiem). */
export const TIMELINE_GRAPH_PROJECT_STATUSES = [
  "active",
  "approved",
  "completed",
] as const satisfies readonly ProjectStatus[];
