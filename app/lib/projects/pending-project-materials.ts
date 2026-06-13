import { aggregateProjectMaterials } from "@/app/lib/estimates/aggregate-project-materials";
import { buildProjectModuleSizeOptions } from "@/app/lib/estimates/sync-module-size-quantities";
import type { EstimateCategory } from "@/app/lib/estimates/types";
import type {
  BuildingModuleDetail,
  BuildingModuleSizeOption,
} from "@/app/lib/modules/types";
import type { PositionPriceSummary } from "@/app/lib/positions/types";
import type { ProjectSummary } from "@/app/lib/projects/types";

export type PendingProjectMaterialsSummary = {
  totalCount: number;
  pendingCount: number;
};

export function countPendingProjectMaterials(
  categories: EstimateCategory[],
  catalogPositions: PositionPriceSummary[],
  moduleSizeOptions: BuildingModuleSizeOption[],
  orderedMaterialPositionIds: string[],
): PendingProjectMaterialsSummary {
  const materials = aggregateProjectMaterials(
    categories,
    catalogPositions,
    moduleSizeOptions,
    { useFrozenPrices: true },
  );
  const orderedIds = new Set(orderedMaterialPositionIds);
  const pendingCount = materials.filter(
    (material) => !orderedIds.has(material.positionPriceId),
  ).length;

  return {
    totalCount: materials.length,
    pendingCount,
  };
}

export function hasPendingProjectMaterials(
  categories: EstimateCategory[],
  catalogPositions: PositionPriceSummary[],
  moduleSizeOptions: BuildingModuleSizeOption[],
  orderedMaterialPositionIds: string[],
): boolean {
  return (
    countPendingProjectMaterials(
      categories,
      catalogPositions,
      moduleSizeOptions,
      orderedMaterialPositionIds,
    ).pendingCount > 0
  );
}

export function buildPendingMaterialsModuleSizeOptions(
  project: ProjectSummary,
  buildingModule: BuildingModuleDetail | null,
  moduleName: string,
  categories: EstimateCategory[],
): BuildingModuleSizeOption[] {
  return buildProjectModuleSizeOptions(
    project,
    buildingModule,
    moduleName,
    categories,
  );
}
