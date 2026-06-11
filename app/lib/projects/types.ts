import type {
  EstimateCategory,
  MultiOptionLinkGroup,
} from "@/app/lib/estimates/types";
import type { ModuleContentBlock } from "@/app/lib/modules/types";
import type { ProjectDescriptionFormState } from "@/app/lib/modules/project-description-types";

/** Form select value for projects without a catalog module. */
export const INDIVIDUAL_PROJECT_MODULE = "__individual__" as const;

export type ProjectSummary = {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  /** ISO timestamp from `projects.created_at`. */
  createdAt: string;
  buildingModuleId: string | null;
  visualizationBlocks: ModuleContentBlock[];
  projectBlocks: ModuleContentBlock[];
  projectDescription: ProjectDescriptionFormState;
};

export type UpdateProjectModuleBlocksInput = {
  id: string;
  visualizationBlocks: ModuleContentBlock[];
  projectBlocks: ModuleContentBlock[];
};

export type UpdateProjectProjectDescriptionInput = {
  id: string;
  projectDescription: ProjectDescriptionFormState;
};

export type CreateProjectInput = {
  clientName: string;
  phone: string;
  email: string;
  address: string;
  phoneCallingCode?: string;
  /** Selected module id, or null for individual project. */
  buildingModuleId: string | null;
};

export type UpdateProjectInput = CreateProjectInput & {
  id: string;
};

export type EstimateMeta = {
  client: string;
  project: string;
  author: string;
  date: string;
  deadline: string;
  number: string;
};

export type ProjectEstimate = {
  title: string;
  meta: EstimateMeta;
  categories: EstimateCategory[];
  multiOptionLinks: MultiOptionLinkGroup[];
};
