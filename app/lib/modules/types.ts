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
};

export type UpdateBuildingModuleBlocksInput = {
  id: string;
  visualizationBlocks: ModuleContentBlock[];
  projectBlocks: ModuleContentBlock[];
};

export type CreateBuildingModuleInput = {
  name: string;
};

export type UpdateBuildingModuleInput = CreateBuildingModuleInput & {
  id: string;
};
