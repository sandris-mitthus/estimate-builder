"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useTransition } from "react";
import { syncPositionFromEstimateLineItemAction } from "@/app/(protected)/positions/actions";
import { useFeedbackToast } from "@/app/components/feedback-toast-provider";
import { useTranslations } from "@/app/components/translations-provider";
import { translateActionError } from "@/app/lib/i18n/action-errors";
import type { EstimateLineItem } from "@/app/lib/estimates/types";
import {
  applyLineItemCatalogEdit,
  resolveLineItemPositionPriceId,
} from "@/app/lib/positions/sync-from-estimate-line-items";
import type { PositionPriceSummary } from "@/app/lib/positions/types";

const NAME_SYNC_DEBOUNCE_MS = 450;

export function useSyncCatalogPositionFromLineItem(
  catalogPositions: PositionPriceSummary[],
) {
  const router = useRouter();
  const { showFeedback } = useFeedbackToast();
  const { t } = useTranslations();
  const [isSyncing, startSync] = useTransition();
  const debounceTimersRef = useRef(
    new Map<string, ReturnType<typeof setTimeout>>(),
  );
  const mountedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    const timers = debounceTimersRef.current;
    return () => {
      mountedRef.current = false;
      for (const timer of timers.values()) {
        clearTimeout(timer);
      }
      timers.clear();
    };
  }, []);

  const syncFromLineItem = useCallback(
    (item: EstimateLineItem) => {
      const linkedItem = applyLineItemCatalogEdit(item, {}, catalogPositions);
      const positionPriceId = resolveLineItemPositionPriceId(
        linkedItem,
        catalogPositions,
      );
      const name = linkedItem.name.trim();
      const unit = linkedItem.unit.trim();

      if (!positionPriceId || !name || !unit) {
        return;
      }

      const catalogPosition = catalogPositions.find(
        (position) => position.id === positionPriceId,
      );
      if (
        catalogPosition &&
        catalogPosition.name.trim() === name &&
        catalogPosition.unit.trim() === unit
      ) {
        return;
      }

      startSync(async () => {
        const result = await syncPositionFromEstimateLineItemAction({
          positionPriceId,
          name,
          unit,
        });

        if (!mountedRef.current) {
          return;
        }

        if (!result.ok) {
          showFeedback({ type: "error", text: translateActionError(t, result) });
          return;
        }

        router.refresh();
      });
    },
    [catalogPositions, router, showFeedback, t],
  );

  const scheduleSyncFromLineItem = useCallback(
    (item: EstimateLineItem) => {
      if (!item.positionPriceId) {
        return;
      }

      const timers = debounceTimersRef.current;
      const existing = timers.get(item.id);
      if (existing) {
        clearTimeout(existing);
      }

      timers.set(
        item.id,
        setTimeout(() => {
          timers.delete(item.id);
          syncFromLineItem(item);
        }, NAME_SYNC_DEBOUNCE_MS),
      );
    },
    [syncFromLineItem],
  );

  const flushSyncFromLineItem = useCallback(
    (item: EstimateLineItem) => {
      const timers = debounceTimersRef.current;
      const existing = timers.get(item.id);
      if (existing) {
        clearTimeout(existing);
        timers.delete(item.id);
      }

      syncFromLineItem(item);
    },
    [syncFromLineItem],
  );

  return {
    syncFromLineItem,
    scheduleSyncFromLineItem,
    flushSyncFromLineItem,
    isSyncing,
  };
}
