"use server";

import { getAdditionalWorkEstimate } from "@/app/lib/additional-work-estimates/repository";
import { getCurrentUser } from "@/app/lib/auth/get-current-user";
import { canPerformAction, getUserAccess } from "@/app/lib/users/groups-repository";
import { checkRateLimit, rateLimitResponse } from "@/app/lib/security/rate-limit";
import { buildEstimateExcel } from "@/app/lib/exports/estimate-excel";
import { listPositionPrices } from "@/app/lib/positions/repository";
import { getProjectEstimate } from "@/app/lib/projects/repository";
import { getCompanySettings } from "@/app/lib/settings/repository";
import { getServerTranslations } from "@/app/lib/i18n/server";

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

  if (!(await checkRateLimit(`excel:${user.id}`, 20, 60_000))) {
    return rateLimitResponse();
  }

  const { projectId } = await params;
  const estimateId = new URL(request.url).searchParams.get("estimateId");

  const [{ t }, catalogPositions, companySettings] = await Promise.all([
    getServerTranslations(),
    listPositionPrices(),
    getCompanySettings(),
  ]);

  const estimate = estimateId
    ? await getAdditionalWorkEstimate(projectId, estimateId)
    : await getProjectEstimate(projectId);

  if (!estimate) {
    return new Response("Not found", { status: 404 });
  }

  const buffer = await buildEstimateExcel(
    estimate.title,
    estimate.meta,
    estimate.categories,
    catalogPositions,
    companySettings.defaultHourlyRate,
    companySettings.vatNumber,
    companySettings.currency,
    t,
  );

  const filenamePrefix = sanitizeDownloadFilenamePart(
    estimateId
      ? estimate.title || t("exports.filename.estimate", "tame")
      : t("exports.filename.estimate", "tame"),
    "tame",
  );
  const filename = `${filenamePrefix}-${(estimateId ?? projectId).slice(0, 8)}.xlsx`;

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
      "Cache-Control": "no-store",
    },
  });
}
