"use server";

import { renderToBuffer } from "@react-pdf/renderer";
import { createElement } from "react";
import { getCurrentUser } from "@/app/lib/auth/get-current-user";
import { checkRateLimit, rateLimitResponse } from "@/app/lib/security/rate-limit";
import { EstimatePdfDocument } from "@/app/lib/exports/estimate-pdf";
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

  if (!checkRateLimit(`pdf:${user.id}`, 20, 60_000)) {
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

  const buffer = await renderToBuffer(
    createElement(EstimatePdfDocument, {
      title: estimate.title,
      meta: estimate.meta,
      categories: estimate.categories,
      catalogPositions,
      defaultHourlyRate: companySettings.defaultHourlyRate,
    }),
  );

  const filename = `piedavajums-${projectId.slice(0, 8)}.pdf`;

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
