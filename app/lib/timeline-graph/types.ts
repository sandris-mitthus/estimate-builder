import type { ProjectStatus } from "@/app/lib/projects/project-status";

/** Apakšrinda zem kategorijas — tiešās pozīcijas vai subkategorija. */
export type TimelineGraphChildSection = {
  id: string;
  kind: "direct" | "subcategory";
  title: string;
  laborWorkloadHours: number;
  /** Cik cilvēki strādā — saīsina kalendāra ilgumu (noklusējums 1). */
  peopleCount: number;
  /** Vienāda vērtība = sākas vienlaikus (paralēli) tajā pašā projektā. */
  parallelGroupId?: string;
};

/** Kategorija ar kopējo darbietilpību un izvēršamiem bērniem. */
export type TimelineGraphCategory = {
  id: string;
  title: string;
  laborWorkloadHours: number;
  peopleCount: number;
  parallelGroupId?: string;
  children: TimelineGraphChildSection[];
};

export type TimelineGraphProject = {
  id: string;
  name: string;
  address: string;
  status: ProjectStatus;
  /** Darbietilpība no līguma tāmes (apjoms × laika norma), stundās. */
  laborWorkloadHours: number;
  peopleCount: number;
  parallelGroupId?: string;
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
