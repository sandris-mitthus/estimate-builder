import type {
  EstimateCategory,
  MultiOptionLinkGroup,
} from "@/app/lib/estimates/types";
import type { ModuleContentBlock } from "@/app/lib/modules/types";
import type { ProjectDescriptionFormState } from "@/app/lib/modules/project-description-types";
import type { ProjectStatus } from "@/app/lib/projects/project-status";

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
  status: ProjectStatus;
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
  /** When set, new project estimate is cloned from this project instead of Sagatave. */
  copyEstimateFromProjectId?: string;
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
  /** ISO timestamp — set only when user saves via Saglabāt tāmi. */
  savedAt?: string;
  /** Saglabāta tāme ar iesaldētām kataloga cenām (kopā ar savedAt). */
  pricesFrozen?: boolean;
  /** Projekts izveidots, klonējot citas projekta tāmi (ne no sagataves). */
  clonedFromProjectId?: string;
  /** Globālo neiekļauto pozīciju ID, kas šim projektam netiek rādītas piedāvājumā. */
  excludedPositionIdsOmitted?: string[];
  /** Kataloga materiālu ID, kas atzīmēti kā pasūtīti (pazūd no materiālu saraksta). */
  orderedMaterialPositionIds?: string[];
  /** Kataloga materiālu ID → piešķirtā lietotāja ID (pasūtīšanas atbildība). */
  materialAssigneeUserIds?: Record<string, string>;
  /** Plānotā peļņa procentos — piemērota vienības cenām (darbs, materiāli, mehānismi). */
  plannedProfitPercent?: number;
  /** Automātiski pievienotas, paslēptas sagataves daļas — lietotājs vēl nav apstiprinājis iepazīšanās bloku. */
  unacknowledgedSagataveStructureIds?: string[];
};

export type ProjectEstimate = {
  id?: string;
  title: string;
  meta: EstimateMeta;
  categories: EstimateCategory[];
  multiOptionLinks: MultiOptionLinkGroup[];
  /** ISO timestamp of when the estimate was last saved (`estimates.updated_at`). */
  updatedAt?: string;
};

export type AdditionalWorkEstimateSummary = {
  id: string;
  title: string;
  meta: EstimateMeta;
  updatedAt?: string;
};
