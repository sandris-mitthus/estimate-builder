"use server";

import { renderToBuffer } from "@react-pdf/renderer";
import { createElement } from "react";
import { getAdditionalWorkEstimate } from "@/app/lib/additional-work-estimates/repository";
import { getCurrentUser } from "@/app/lib/auth/get-current-user";
import { canPerformAction, getUserAccess } from "@/app/lib/users/groups-repository";
import { checkRateLimit, rateLimitResponse } from "@/app/lib/security/rate-limit";
import { applyProfitModuleToMeta } from "@/app/lib/estimates/planned-profit";
import { FRONTEND_MODULE_KEYS } from "@/app/lib/frontend-modules/keys";
import { isFrontendModuleEnabled } from "@/app/lib/frontend-modules/repository";
import { EstimatePdfDocument } from "@/app/lib/exports/estimate-pdf";
import {
  fetchLogoAsset,
  fetchVisualizationImages,
  type PdfImageAsset,
} from "@/app/lib/exports/pdf-image-fetch";
import type { ExcludedPosition } from "@/app/lib/excluded-positions/types";
import { listExcludedPositions } from "@/app/lib/excluded-positions/repository";
import { resolveProjectExcludedPositions } from "@/app/lib/excluded-positions/resolve-project-excluded-positions";
import { listPositionPrices } from "@/app/lib/positions/repository";
import {
  getProject,
  getProjectEstimateForProject,
} from "@/app/lib/projects/repository";
import type { ProjectEstimate } from "@/app/lib/projects/types";
import { getCompanySettings } from "@/app/lib/settings/repository";
import { getBuildingModule } from "@/app/lib/modules/repository";
import { ensureDefaultEstimatePosition } from "@/app/lib/estimate-positions/repository";
import { syncSubcategoryOfferVisibilityFromSagatave } from "@/app/lib/estimate-positions/sync-subcategory-offer-visibility";
import { getServerTranslations } from "@/app/lib/i18n/server";
import type { EstimateCategory } from "@/app/lib/estimates/types";

function sanitizeDownloadFilenamePart(value: string, fallback: string): string {
  const sanitized = value
    .normalize("NFKD")
    .replace(/[^\w.-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);

  return sanitized || fallback;
}

export async function GET(
  request: Request,
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
  const estimateId = new URL(request.url).searchParams.get("estimateId");

  const [{ t }, project, catalogPositions, companySettings, profitModuleEnabled] =
    await Promise.all([
      getServerTranslations(),
      getProject(projectId),
      listPositionPrices(),
      getCompanySettings(),
      isFrontendModuleEnabled(FRONTEND_MODULE_KEYS.profit),
    ]);

  if (!project) {
    return new Response("Not found", { status: 404 });
  }

  let estimate: ProjectEstimate | null;
  let categoriesForOffer: EstimateCategory[];
  let excludedPositions: ExcludedPosition[] = [];
  let visualizationImages: PdfImageAsset[] = [];

  const [buildingModule, logo] = await Promise.all([
    project.buildingModuleId
      ? getBuildingModule(project.buildingModuleId)
      : Promise.resolve(null),
    fetchLogoAsset(),
  ]);

  if (estimateId) {
    estimate = await getAdditionalWorkEstimate(projectId, estimateId);
    if (!estimate) {
      return new Response("Not found", { status: 404 });
    }
    categoriesForOffer = estimate.categories;
  } else {
    const [mainEstimate, globalExcludedPositions, sagatave] = await Promise.all([
      getProjectEstimateForProject(project, companySettings.estimateValidityDays),
      listExcludedPositions(),
      ensureDefaultEstimatePosition(),
    ]);

    if (!mainEstimate) {
      return new Response("Not found", { status: 404 });
    }

    estimate = mainEstimate;
    categoriesForOffer = syncSubcategoryOfferVisibilityFromSagatave(
      estimate.categories,
      sagatave.sections,
    );
    excludedPositions = resolveProjectExcludedPositions(
      globalExcludedPositions,
      estimate.meta.excludedPositionIdsOmitted,
    );

    const moduleVisualizations = buildingModule
      ? buildingModule.visualizationBlocks
      : project.visualizationBlocks;
    visualizationImages = await fetchVisualizationImages(moduleVisualizations);
  }

  const displayModuleName =
    buildingModule?.name ?? t("projects.individual_project", "Individuāls projekts");

  const buffer = await renderToBuffer(
    createElement(EstimatePdfDocument, {
      title: estimate.title,
      meta: applyProfitModuleToMeta(estimate.meta, profitModuleEnabled),
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

  const filenamePrefix = sanitizeDownloadFilenamePart(
    estimateId
      ? estimate.title || t("exports.filename.offer", "piedavajums")
      : t("exports.filename.offer", "piedavajums"),
    "piedavajums",
  );
  const filename = `${filenamePrefix}-${(estimateId ?? projectId).slice(0, 8)}.pdf`;

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
      "Cache-Control": "no-store",
    },
  });
}
