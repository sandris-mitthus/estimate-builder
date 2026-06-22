import type { ModuleSizeSummarySection } from "@/app/lib/modules/module-size-summary-types";
import type { ProjectDescriptionFormState } from "@/app/lib/modules/project-description-types";

export type ModuleOutlineSubcategory = {
  id: string;
  title: string;
};

export type ModuleOutlineCategory = {
  id: string;
  title: string;
  subcategories: ModuleOutlineSubcategory[];
};

export type ModuleOutline = ModuleOutlineCategory[];

export type BuildingModuleSummary = {
  id: string;
  name: string;
  note: string;
  moduleDataComplete: boolean;
};

/** Moduļa lielumi sagatavēs / tāmēs — tikai moduļi ar aizpildītu `project_description`. */
export type BuildingModuleSizeOption = {
  id: string;
  name: string;
  sections: ModuleSizeSummarySection[];
  projectDescription: ProjectDescriptionFormState;
};

export type ModuleContentBlock = {
  id: string;
  title: string;
  fileUrl: string;
  mimeType: string;
  storagePath: string;
};

export type ModuleBlockKind = "visualization" | "project";

export type BuildingModuleDetail = BuildingModuleSummary & {
  outline: ModuleOutline;
  visualizationBlocks: ModuleContentBlock[];
  projectBlocks: ModuleContentBlock[];
  projectDescription: ProjectDescriptionFormState;
};

export type UpdateBuildingModuleProjectDescriptionInput = {
  id: string;
  projectDescription: ProjectDescriptionFormState;
};

export type UpdateBuildingModuleBlocksInput = {
  id: string;
  visualizationBlocks: ModuleContentBlock[];
  projectBlocks: ModuleContentBlock[];
};

export type CreateBuildingModuleInput = {
  name: string;
  note?: string;
};

export type UpdateBuildingModuleInput = CreateBuildingModuleInput & {
  id: string;
};
