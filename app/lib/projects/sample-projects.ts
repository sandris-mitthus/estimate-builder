import type { ProjectSummary } from "@/app/lib/projects/types";
import { createEmptyProjectDescriptionFormState } from "@/app/lib/modules/project-description-types";

const SAMPLE_PROJECT_DESCRIPTION = createEmptyProjectDescriptionFormState();

export const SAMPLE_PROJECTS: ProjectSummary[] = [
  {
    id: "proj-1",
    name: "Biroja ēkas 1. stāva renovācija",
    address: "Brīvības iela 45, Rīga, LV-1010",
    phone: "",
    email: "",
    createdAt: "2026-06-09T10:00:00.000Z",
    buildingModuleId: null,
    visualizationBlocks: [],
    projectBlocks: [],
    projectDescription: SAMPLE_PROJECT_DESCRIPTION,
  },
  {
    id: "proj-2",
    name: "Daudzdzīvokļu mājas fasādes atjaunošana",
    address: "Daugavgrīvas iela 12, Rīga, LV-1048",
    phone: "",
    email: "",
    createdAt: "2026-05-15T10:00:00.000Z",
    buildingModuleId: null,
    visualizationBlocks: [],
    projectBlocks: [],
    projectDescription: SAMPLE_PROJECT_DESCRIPTION,
  },
  {
    id: "proj-3",
    name: "Ražotnes noliktavas jaunbūve",
    address: "Industriālais bulvāris 7, Jelgava, LV-3004",
    phone: "",
    email: "",
    createdAt: "2026-04-20T10:00:00.000Z",
    buildingModuleId: null,
    visualizationBlocks: [],
    projectBlocks: [],
    projectDescription: SAMPLE_PROJECT_DESCRIPTION,
  },
  {
    id: "proj-4",
    name: "Viesnīcas numuru kompleksā remonts",
    address: "Elizabetes iela 22, Rīga, LV-1050",
    phone: "",
    email: "",
    createdAt: "2026-03-01T10:00:00.000Z",
    buildingModuleId: null,
    visualizationBlocks: [],
    projectBlocks: [],
    projectDescription: SAMPLE_PROJECT_DESCRIPTION,
  },
];

export function getProjectById(id: string): ProjectSummary | undefined {
  return SAMPLE_PROJECTS.find((project) => project.id === id);
}
