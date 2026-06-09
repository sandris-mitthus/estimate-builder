import type { ProjectSummary } from "@/app/lib/projects/types";

export const SAMPLE_PROJECTS: ProjectSummary[] = [
  {
    id: "proj-1",
    name: "Biroja ēkas 1. stāva renovācija",
    address: "Brīvības iela 45, Rīga, LV-1010",
  },
  {
    id: "proj-2",
    name: "Daudzdzīvokļu mājas fasādes atjaunošana",
    address: "Daugavgrīvas iela 12, Rīga, LV-1048",
  },
  {
    id: "proj-3",
    name: "Ražotnes noliktavas jaunbūve",
    address: "Industriālais bulvāris 7, Jelgava, LV-3004",
  },
  {
    id: "proj-4",
    name: "Viesnīcas numuru kompleksā remonts",
    address: "Elizabetes iela 22, Rīga, LV-1050",
  },
];

export function getProjectById(id: string): ProjectSummary | undefined {
  return SAMPLE_PROJECTS.find((project) => project.id === id);
}
