import { parseModuleContentBlocks } from "@/app/lib/modules/parse-blocks";
import { parseProjectDescriptionFormState } from "@/app/lib/modules/parse-project-description";
import type { ModuleContentBlock } from "@/app/lib/modules/types";

export function parseProjectModuleBlocks(row: {
  visualization_blocks?: unknown;
  project_blocks?: unknown;
  project_description?: unknown;
}) {
  return {
    visualizationBlocks: parseModuleContentBlocks(row.visualization_blocks),
    projectBlocks: parseModuleContentBlocks(row.project_blocks),
    projectDescription: parseProjectDescriptionFormState(row.project_description),
  };
}

export function isIndividualProjectModuleDataComplete(project: {
  visualizationBlocks: ModuleContentBlock[];
  projectBlocks: ModuleContentBlock[];
  projectDescription?: { livingAreaM2?: string };
}): boolean {
  const livingAreaM2 = project.projectDescription?.livingAreaM2?.trim() ?? "";
  return (
    project.visualizationBlocks.length > 0 &&
    project.projectBlocks.length > 0 &&
    livingAreaM2.length > 0
  );
}
