"use server";

import { getCurrentUser } from "@/app/lib/auth/get-current-user";
import { canPerformAction, getUserAccess } from "@/app/lib/users/groups-repository";
import { checkRateLimit, rateLimitResponse } from "@/app/lib/security/rate-limit";
import { buildEstimateExcel } from "@/app/lib/exports/estimate-excel";
import { listPositionPrices } from "@/app/lib/positions/repository";
import { getProjectEstimate } from "@/app/lib/projects/repository";
import { getCompanySettings } from "@/app/lib/settings/repository";

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

  if (!checkRateLimit(`excel:${user.id}`, 20, 60_000)) {
    return rateLimitResponse();
  }

  const { projectId } = await params;
  const [estimate, catalogPositions, companySettings] = await Promise.all([
    getProjectEstimate(projectId),
    listPositionPrices(),
    getCompanySettings(),
  ]);

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
  );

  const filename = `tame-${projectId.slice(0, 8)}.xlsx`;

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
