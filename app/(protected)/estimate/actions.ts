"use server";



import { revalidatePath } from "next/cache";

import { requireAction } from "@/app/lib/auth/require-permission";
import { collectSectionLineItems } from "@/app/lib/estimate-positions/collect-section-items";
import { saveEstimatePositionDocument } from "@/app/lib/estimate-positions/repository";
import type { SaveEstimatePositionDocumentInput } from "@/app/lib/estimate-positions/types";
import { listPositionPrices } from "@/app/lib/positions/repository";
import { syncEstimateLineItemsToCatalog } from "@/app/lib/positions/sync-estimate-line-items-to-catalog";
import { hydrateSectionsWithCatalogLinks } from "@/app/lib/positions/sync-from-estimate-line-items";
import { getCompanySettings } from "@/app/lib/settings/repository";



function revalidateSagatave() {
  revalidatePath("/estimate");
  revalidatePath("/positions");
  revalidatePath("/");
}



export async function saveEstimatePositionDocumentAction(

  input: SaveEstimatePositionDocumentInput,

) {
  const { denied } = await requireAction("sagatave.save");
  if (denied) return denied;

  const [catalogPositions, companySettings] = await Promise.all([
    listPositionPrices(),
    getCompanySettings(),
  ]);
  const sections = hydrateSectionsWithCatalogLinks(
    input.sections,
    catalogPositions,
    companySettings.defaultHourlyRate,
    { forceCatalogPrices: true },
  );
  const result = await saveEstimatePositionDocument({
    ...input,
    sections,
  });

  if (result.ok) {
    const syncResult = await syncEstimateLineItemsToCatalog(
      collectSectionLineItems(sections),
      catalogPositions,
    );

    if (!syncResult.ok) {
      return syncResult;
    }

    revalidateSagatave();
  }



  return result;

}

