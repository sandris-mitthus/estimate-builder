import {
  isCompositeLineItem,
  resolveEffectiveMaterials,
  resolveEffectiveMechanisms,
} from "@/app/lib/estimates/composite-line-item";
import type { EstimateLineItem, LineItemCatalogRef } from "@/app/lib/estimates/types";
import { batchUpdatePositionNamesAndUnits } from "@/app/lib/positions/repository";
import { resolveLineItemPositionPriceId } from "@/app/lib/positions/sync-from-estimate-line-items";
import type { PositionPriceSummary } from "@/app/lib/positions/types";

function collectCatalogRefsFromLineItem(item: EstimateLineItem): LineItemCatalogRef[] {
  if (isCompositeLineItem(item)) {
    return [
      ...resolveEffectiveMaterials(item),
      ...resolveEffectiveMechanisms(item),
    ];
  }

  const positionPriceId = item.positionPriceId;
  if (!positionPriceId) {
    return [];
  }

  return [
    {
      positionPriceId,
      name: item.name,
      unit: item.unit,
    },
  ];
}

export async function syncEstimateLineItemsToCatalog(
  items: EstimateLineItem[],
  catalogPositions: PositionPriceSummary[],
): Promise<{ ok: true } | { ok: false; error: string }> {
  const catalogById = new Map(catalogPositions.map((position) => [position.id, position]));
  const syncedIds = new Set<string>();
  const pendingUpdates: { id: string; name: string; unit: string }[] = [];

  for (const item of items) {
    const refs = collectCatalogRefsFromLineItem(item);

    for (const ref of refs) {
      const positionPriceId =
        ref.positionPriceId ??
        resolveLineItemPositionPriceId(
          {
            ...item,
            positionPriceId: ref.positionPriceId,
            name: ref.name,
            unit: ref.unit,
          },
          catalogPositions,
        );
      const name = ref.name.trim();
      const unit = ref.unit.trim();

      if (!positionPriceId || !name || !unit || syncedIds.has(positionPriceId)) {
        continue;
      }

      syncedIds.add(positionPriceId);

      const catalogPosition = catalogById.get(positionPriceId);
      if (
        catalogPosition &&
        catalogPosition.name.trim() === name &&
        catalogPosition.unit.trim() === unit
      ) {
        continue;
      }

      pendingUpdates.push({ id: positionPriceId, name, unit });
    }
  }

  return batchUpdatePositionNamesAndUnits(pendingUpdates);
}
