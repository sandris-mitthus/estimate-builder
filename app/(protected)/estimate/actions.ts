"use server";



import { revalidatePath } from "next/cache";

import { requireAuth } from "@/app/lib/auth/require-auth";
import { collectSectionLineItems } from "@/app/lib/estimate-positions/collect-section-items";
import { saveEstimatePositionDocument } from "@/app/lib/estimate-positions/repository";
import type { SaveEstimatePositionDocumentInput } from "@/app/lib/estimate-positions/types";
import { listPositionPrices } from "@/app/lib/positions/repository";
import {
  hydrateSectionsWithCatalogLinks,
  syncEstimateLineItemsToCatalog,
} from "@/app/lib/positions/sync-from-estimate-line-items";
import { getCompanySettings } from "@/app/lib/settings/repository";



function revalidateSagatave() {
  revalidatePath("/estimate");
  revalidatePath("/settings/positions");
}



export async function saveEstimatePositionDocumentAction(

  input: SaveEstimatePositionDocumentInput,

) {
  const { denied } = await requireAuth();
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

