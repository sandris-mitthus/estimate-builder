import type { ModuleContentBlock } from "@/app/lib/modules/types";

export function isBuildingModuleDataComplete(module: {
  visualizationBlocks: ModuleContentBlock[];
  projectBlocks: ModuleContentBlock[];
}): boolean {
  return (
    module.visualizationBlocks.length > 0 && module.projectBlocks.length > 0
  );
}
