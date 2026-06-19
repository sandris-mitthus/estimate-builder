import { isCompositeLineItem } from "@/app/lib/estimates/composite-line-item";
import type { EstimateLineItem } from "@/app/lib/estimates/types";
import { updatePositionNameAndUnit } from "@/app/lib/positions/repository";
import { resolveLineItemPositionPriceId } from "@/app/lib/positions/sync-from-estimate-line-items";
import type { PositionPriceSummary } from "@/app/lib/positions/types";

export async function syncEstimateLineItemsToCatalog(
  items: EstimateLineItem[],
  catalogPositions: PositionPriceSummary[],
): Promise<{ ok: true } | { ok: false; error: string }> {
  const syncedIds = new Set<string>();

  for (const item of items) {
    if (isCompositeLineItem(item)) {
      continue;
    }

    const positionPriceId = resolveLineItemPositionPriceId(item, catalogPositions);
    const name = item.name.trim();
    const unit = item.unit.trim();

    if (!positionPriceId || !name || !unit || syncedIds.has(positionPriceId)) {
      continue;
    }

    const result = await updatePositionNameAndUnit({
      id: positionPriceId,
      name,
      unit,
    });

    if (!result.ok) {
      return result;
    }

    syncedIds.add(positionPriceId);
  }

  return { ok: true };
}
