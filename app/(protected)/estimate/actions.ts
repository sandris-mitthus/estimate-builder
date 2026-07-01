"use server";

import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAction } from "@/app/lib/auth/require-permission";
import { collectSectionLineItems } from "@/app/lib/estimate-positions/collect-section-items";
import { estimateSectionsUseModuleSizeOptions } from "@/app/lib/estimate-positions/sections-use-module-size-options";
import { saveEstimatePositionDocument } from "@/app/lib/estimate-positions/repository";
import type {
  EstimatePositionSection,
  SaveEstimatePositionDocumentInput,
} from "@/app/lib/estimate-positions/types";
import { listBuildingModuleSizeOptions } from "@/app/lib/modules/repository";
import { listPositionPricesForHydration } from "@/app/lib/positions/repository";
import { syncEstimateLineItemsToCatalog } from "@/app/lib/positions/sync-estimate-line-items-to-catalog";
import { hydrateSectionsWithCatalogLinks } from "@/app/lib/positions/sync-from-estimate-line-items";
import { getCompanySettings } from "@/app/lib/settings/repository";

function revalidateSagatave() {
  revalidatePath("/estimate");
  revalidatePath("/positions");
  revalidatePath("/");
}

export type SaveEstimatePositionDocumentResult =
  | { ok: true; sections: EstimatePositionSection[] }
  | { ok: false; error: string };

export async function saveEstimatePositionDocumentAction(
  input: SaveEstimatePositionDocumentInput,
): Promise<SaveEstimatePositionDocumentResult> {
  try {
    const { denied } = await requireAction("sagatave.save");
    if (denied) return denied;

    const needsModuleSizeOptions = estimateSectionsUseModuleSizeOptions(
      input.sections,
    );

    const [catalogPositions, companySettings, moduleSizeOptions] =
      await Promise.all([
        listPositionPricesForHydration(),
        getCompanySettings(),
        needsModuleSizeOptions
          ? listBuildingModuleSizeOptions()
          : Promise.resolve([]),
      ]);

    const sections = hydrateSectionsWithCatalogLinks(
      input.sections,
      catalogPositions,
      companySettings.defaultHourlyRate,
      { forceCatalogPrices: true, moduleSizeOptions },
    );

    const result = await saveEstimatePositionDocument({
      ...input,
      sections,
    });

    if (!result.ok) {
      return result;
    }

    const lineItems = collectSectionLineItems(sections);
    after(async () => {
      const syncResult = await syncEstimateLineItemsToCatalog(
        lineItems,
        catalogPositions,
      );
      if (!syncResult.ok) {
        console.error("syncEstimateLineItemsToCatalog failed:", syncResult.error);
      }
      revalidateSagatave();
    });

    return { ok: true, sections };
  } catch (error) {
    console.error("saveEstimatePositionDocumentAction failed:", error);
    return {
      ok: false,
      error: "Neizdevās saglabāt tāmes pozīciju.",
    };
  }
}
