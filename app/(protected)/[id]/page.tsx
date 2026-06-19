import Link from "next/link";
import { notFound } from "next/navigation";
import { EstimateTable } from "@/app/components/estimate-table";
import { assertNavAccess } from "@/app/lib/auth/assert-nav-access";
import {
  buildProjectModuleSizeOptions,
  syncCategoriesQuantitiesFromModuleSizes,
} from "@/app/lib/estimates/sync-module-size-quantities";
import { ensureDefaultEstimatePosition } from "@/app/lib/estimate-positions/repository";
import { syncVariableQuantityFromSagatave } from "@/app/lib/estimate-positions/sync-variable-quantity";
import { listExcludedPositions } from "@/app/lib/excluded-positions/repository";
import { getBuildingModule, listBuildingModules } from "@/app/lib/modules/repository";
import { getProject, getProjectEstimate } from "@/app/lib/projects/repository";
import { listPositionPrices } from "@/app/lib/positions/repository";
import { getCompanySettings } from "@/app/lib/settings/repository";
import { listUsers } from "@/app/lib/users/repository";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await assertNavAccess("projects");
  if (!session) {
    return null;
  }

  const { id } = await params;
  const [
    project,
    estimate,
    modules,
    companySettings,
    catalogPositions,
    sagatave,
    globalExcludedPositions,
    users,
  ] = await Promise.all([
    getProject(id),
    getProjectEstimate(id),
    listBuildingModules(),
    getCompanySettings(),
    listPositionPrices(),
    ensureDefaultEstimatePosition(),
    listExcludedPositions(),
    listUsers(),
  ]);

  if (!project || !estimate) {
    notFound();
  }

  const buildingModule = project.buildingModuleId
    ? await getBuildingModule(project.buildingModuleId)
    : null;

  const moduleVisualizations = buildingModule
    ? buildingModule.visualizationBlocks
    : project.visualizationBlocks;

  const displayModuleName = buildingModule?.name ?? "Individuāls projekts";
  const moduleSizeOptions = buildProjectModuleSizeOptions(
    project,
    buildingModule,
    displayModuleName,
    estimate.categories,
  );
  const categoriesWithVariableQty = syncVariableQuantityFromSagatave(
    estimate.categories,
    sagatave.sections,
  );
  const initialCategories =
    moduleSizeOptions.length > 0
      ? syncCategoriesQuantitiesFromModuleSizes(
          categoriesWithVariableQty,
          moduleSizeOptions[0].projectDescription,
          catalogPositions,
        )
      : categoriesWithVariableQty;

  return (
    <main className="page">
      <Link
        href="/"
        className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-zinc-500 transition hover:text-zinc-900"
      >
        <i className="fas fa-arrow-left text-xs" aria-hidden="true" />
        Atpakaļ uz projektiem
      </Link>
      <EstimateTable
        initialTitle={estimate.title}
        initialMeta={estimate.meta}
        initialCategories={initialCategories}
        initialMultiOptionLinks={estimate.multiOptionLinks}
        estimateUpdatedAt={estimate.updatedAt}
        moduleName={buildingModule?.name ?? null}
        moduleVisualizations={moduleVisualizations}
        moduleSizeOptions={moduleSizeOptions}
        project={project}
        modules={modules}
        estimateValidityDays={companySettings.estimateValidityDays}
        catalogPositions={catalogPositions}
        defaultHourlyRate={companySettings.defaultHourlyRate}
        currency={companySettings.currency}
        sagataveSections={sagatave.sections}
        sagataveMultiOptionLinks={sagatave.multiOptionLinks}
        globalExcludedPositions={globalExcludedPositions}
        users={users}
      />
    </main>
  );
}
