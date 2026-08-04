import type { ModuleContentBlock } from "@/app/lib/modules/types";

function hasLivingArea(value: string | undefined): boolean {
  return (value ?? "").trim().length > 0;
}

export function isBuildingModuleDataComplete(module: {
  visualizationBlocks: ModuleContentBlock[];
  projectBlocks: ModuleContentBlock[];
  livingAreaM2?: string;
  projectDescription?: { livingAreaM2?: string };
}): boolean {
  const livingAreaM2 =
    module.livingAreaM2 ?? module.projectDescription?.livingAreaM2 ?? "";

  return (
    module.visualizationBlocks.length > 0 &&
    module.projectBlocks.length > 0 &&
    hasLivingArea(livingAreaM2)
  );
}
