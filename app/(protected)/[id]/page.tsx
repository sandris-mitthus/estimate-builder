import Link from "next/link";
import { notFound } from "next/navigation";
import { EstimateTable } from "@/app/components/estimate-table";
import { assertNavAccess } from "@/app/lib/auth/assert-nav-access";
import { canPerformAction } from "@/app/lib/users/groups-repository";
import { listAdditionalWorkEstimates } from "@/app/lib/additional-work-estimates/repository";
import { FRONTEND_MODULE_KEYS } from "@/app/lib/frontend-modules/keys";
import { isFrontendModuleEnabled } from "@/app/lib/frontend-modules/repository";
import { ProjectAdditionalWorkSection } from "@/app/components/project-additional-work-section";
import {
  buildProjectModuleSizeOptions,
  syncCategoriesQuantitiesFromModuleSizes,
} from "@/app/lib/estimates/sync-module-size-quantities";
import { ensureDefaultEstimatePosition } from "@/app/lib/estimate-positions/repository";
import { ensureHiddenSagataveStructureForProject } from "@/app/lib/estimate-positions/sagatave-to-other-projects";
import { syncVariableQuantityFromSagatave } from "@/app/lib/estimate-positions/sync-variable-quantity";
import { listExcludedPositions } from "@/app/lib/excluded-positions/repository";
import { getBuildingModule, listBuildingModules } from "@/app/lib/modules/repository";
import {
  getProject,
  getProjectEstimateForProject,
} from "@/app/lib/projects/repository";
import { isProjectEstimateLocked } from "@/app/lib/projects/project-status";
import { listPositionPrices } from "@/app/lib/positions/repository";
import { getCompanySettings } from "@/app/lib/settings/repository";
import { listUsers } from "@/app/lib/users/repository";
import { getServerTranslations } from "@/app/lib/i18n/server";

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
  const { t } = await getServerTranslations();
  const additionalWorkModuleEnabled = await isFrontendModuleEnabled(
    FRONTEND_MODULE_KEYS.additionalWork,
  );
  const [
    project,
    modules,
    companySettings,
    catalogPositions,
    sagatave,
    globalExcludedPositions,
  ] = await Promise.all([
    getProject(id),
    listBuildingModules(),
    getCompanySettings(),
    listPositionPrices(),
    ensureDefaultEstimatePosition(),
    listExcludedPositions(),
  ]);

  if (!project) {
    notFound();
  }

  await ensureHiddenSagataveStructureForProject(id);

  const estimate = await getProjectEstimateForProject(
    project,
    companySettings.estimateValidityDays,
  );

  if (!estimate) {
    notFound();
  }

  const [buildingModule, users, additionalWorkEstimates] = await Promise.all([
    project.buildingModuleId ? getBuildingModule(project.buildingModuleId) : null,
    isProjectEstimateLocked(project.status) ? listUsers() : [],
    additionalWorkModuleEnabled
      ? listAdditionalWorkEstimates(project.id)
      : Promise.resolve([]),
  ]);

  const moduleVisualizations = buildingModule
    ? buildingModule.visualizationBlocks
    : project.visualizationBlocks;

  const displayModuleName =
    buildingModule?.name ?? t("projects.individual_project", "Individuāls projekts");
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
        {t("projects.back_to_projects", "Atpakaļ uz projektiem")}
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
      {additionalWorkModuleEnabled ? (
        <div className="mt-8">
          <ProjectAdditionalWorkSection
            project={project}
            estimates={additionalWorkEstimates}
            canManage={canPerformAction(session.access, "estimate.save")}
          />
        </div>
      ) : null}
    </main>
  );
}
