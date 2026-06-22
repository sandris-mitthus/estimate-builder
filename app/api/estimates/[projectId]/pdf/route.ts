"use server";

import { renderToBuffer } from "@react-pdf/renderer";
import { createElement } from "react";
import { getCurrentUser } from "@/app/lib/auth/get-current-user";
import { canPerformAction, getUserAccess } from "@/app/lib/users/groups-repository";
import { checkRateLimit, rateLimitResponse } from "@/app/lib/security/rate-limit";
import { EstimatePdfDocument } from "@/app/lib/exports/estimate-pdf";
import { fetchLogoAsset, fetchVisualizationImages } from "@/app/lib/exports/pdf-image-fetch";
import { listExcludedPositions } from "@/app/lib/excluded-positions/repository";
import { resolveProjectExcludedPositions } from "@/app/lib/excluded-positions/resolve-project-excluded-positions";
import { listPositionPrices } from "@/app/lib/positions/repository";
import { getProject, getProjectEstimate } from "@/app/lib/projects/repository";
import { getCompanySettings } from "@/app/lib/settings/repository";
import { getBuildingModule } from "@/app/lib/modules/repository";
import { ensureDefaultEstimatePosition } from "@/app/lib/estimate-positions/repository";
import { syncSubcategoryOfferVisibilityFromSagatave } from "@/app/lib/estimate-positions/sync-subcategory-offer-visibility";
import { getServerTranslations } from "@/app/lib/i18n/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const access = await getUserAccess(user.id);
  if (!canPerformAction(access, "estimate.export")) {
    return new Response("Forbidden", { status: 403 });
  }

  if (!(await checkRateLimit(`pdf:${user.id}`, 20, 60_000))) {
    return rateLimitResponse();
  }

  const { projectId } = await params;

  const [{ t }, project, estimate, catalogPositions, companySettings, globalExcludedPositions] =
    await Promise.all([
      getServerTranslations(),
      getProject(projectId),
      getProjectEstimate(projectId),
      listPositionPrices(),
      getCompanySettings(),
      listExcludedPositions(),
    ]);

  if (!project || !estimate) {
    return new Response("Not found", { status: 404 });
  }

  const buildingModule = project.buildingModuleId
    ? await getBuildingModule(project.buildingModuleId)
    : null;

  const displayModuleName =
    buildingModule?.name ?? t("projects.individual_project", "Individuāls projekts");
  const moduleVisualizations = buildingModule
    ? buildingModule.visualizationBlocks
    : project.visualizationBlocks;

  const [logo, visualizationImages, sagatave] = await Promise.all([
    fetchLogoAsset(),
    fetchVisualizationImages(moduleVisualizations),
    ensureDefaultEstimatePosition(),
  ]);

  const categoriesForOffer = syncSubcategoryOfferVisibilityFromSagatave(
    estimate.categories,
    sagatave.sections,
  );

  const excludedPositions = resolveProjectExcludedPositions(
    globalExcludedPositions,
    estimate.meta.excludedPositionIdsOmitted,
  );

  const buffer = await renderToBuffer(
    createElement(EstimatePdfDocument, {
      title: estimate.title,
      meta: estimate.meta,
      categories: categoriesForOffer,
      catalogPositions,
      defaultHourlyRate: companySettings.defaultHourlyRate,
      company: companySettings,
      logo,
      projectInfo: {
        moduleName: displayModuleName,
        clientName: project.name,
        address: project.address,
        phone: project.phone,
        email: project.email,
      },
      visualizationImages,
      excludedPositions,
      t,
    }),
  );

  const filenamePrefix = t("exports.filename.offer", "piedavajums");
  const filename = `${filenamePrefix}-${projectId.slice(0, 8)}.pdf`;

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
