import { collectEstimateLineItems } from "@/app/lib/estimates/calculate-totals";
import {
  formatAmountDisplay,
  roundToTwoDecimals,
} from "@/app/lib/estimates/calculate-line";
import {
  deriveCompositeUnitPrice,
  isCompositeLineItem,
} from "@/app/lib/estimates/composite-line-item";
import { isEstimateMultiPosition } from "@/app/lib/estimates/multi-position";
import type {
  EstimateCategory,
  EstimateLineItem,
  EstimateRowItem,
  PriceBreakdown,
} from "@/app/lib/estimates/types";
import type { EstimateMeta } from "@/app/lib/projects/types";
import {
  buildUnitPriceForCatalogPosition,
  isMaterialsOrMechanismsCostType,
} from "@/app/lib/positions/apply-catalog-to-line-item";
import { findCatalogPositionForLineItem } from "@/app/lib/positions/sync-from-estimate-line-items";
import type { PositionPriceSummary } from "@/app/lib/positions/types";

export type StaleCatalogPriceField = "materials" | "mechanisms";

export type StaleCatalogPriceHints = Partial<
  Record<StaleCatalogPriceField, string>
>;

function pricesDiffer(stored: number, live: number): boolean {
  return roundToTwoDecimals(stored) !== roundToTwoDecimals(live);
}

function staleHintLabel(livePrice: number): string {
  return `Atjaunināta cena: ${formatAmountDisplay(livePrice)}`;
}

const LEGACY_SAVED_ESTIMATE_MS = 120_000;

export type ProjectEstimateSavedContext = {
  projectCreatedAt?: string;
  estimateUpdatedAt?: string;
};

export function isProjectEstimateSaved(
  meta: EstimateMeta,
  context?: ProjectEstimateSavedContext,
): boolean {
  if (meta.savedAt || meta.pricesFrozen) {
    return true;
  }

  if (!context?.estimateUpdatedAt || !context.projectCreatedAt) {
    return false;
  }

  const updated = Date.parse(context.estimateUpdatedAt);
  const created = Date.parse(context.projectCreatedAt);
  if (!Number.isFinite(updated) || !Number.isFinite(created)) {
    return false;
  }

  // Vecās tāmes bez meta.savedAt — rinda atjaunināta pēc izveides (saglabāšana).
  return updated > created + LEGACY_SAVED_ESTIMATE_MS;
}

/** Aktuālās cenas no kataloga / iestatījumiem (sagatave, nesaglabāta projekta tāme). */
export function resolveLiveDisplayUnitPrice(
  item: EstimateLineItem,
  catalogPositions: PositionPriceSummary[],
  defaultHourlyRate: number | null,
): PriceBreakdown {
  if (isCompositeLineItem(item)) {
    return deriveCompositeUnitPrice(item, catalogPositions, defaultHourlyRate);
  }

  const position = findCatalogPositionForLineItem(item, catalogPositions);
  if (position) {
    return buildUnitPriceForCatalogPosition(position, defaultHourlyRate);
  }

  return item.unitPrice;
}

/** Saglabātā projekta tāmē rāda iesaldēto materiālu / mehānismu cenu. */
export function resolveFrozenEstimateDisplayUnitPrice(
  item: EstimateLineItem,
  catalogPositions: PositionPriceSummary[],
  defaultHourlyRate: number | null,
): PriceBreakdown {
  if (isCompositeLineItem(item)) {
    const live = deriveCompositeUnitPrice(
      item,
      catalogPositions,
      defaultHourlyRate,
    );

    return {
      labor: live.labor,
      materials: item.unitPrice.materials,
      mechanisms: item.unitPrice.mechanisms,
    };
  }

  const position = findCatalogPositionForLineItem(item, catalogPositions);
  if (
    position &&
    (position.costType === "materials" || position.costType === "mechanisms")
  ) {
    return item.unitPrice;
  }

  return resolveLiveDisplayUnitPrice(item, catalogPositions, defaultHourlyRate);
}

export function resolveStaleCatalogPriceHints(
  item: EstimateLineItem,
  catalogPositions: PositionPriceSummary[],
  defaultHourlyRate: number | null,
): StaleCatalogPriceHints {
  const hints: StaleCatalogPriceHints = {};
  const stored = item.unitPrice;

  if (isCompositeLineItem(item)) {
    const live = deriveCompositeUnitPrice(
      item,
      catalogPositions,
      defaultHourlyRate,
    );

    if (
      item.material?.positionPriceId &&
      pricesDiffer(stored.materials, live.materials)
    ) {
      hints.materials = staleHintLabel(live.materials);
    }

    if (
      item.mechanism?.positionPriceId &&
      pricesDiffer(stored.mechanisms, live.mechanisms)
    ) {
      hints.mechanisms = staleHintLabel(live.mechanisms);
    }

    return hints;
  }

  const position = findCatalogPositionForLineItem(item, catalogPositions);
  if (!position) {
    return hints;
  }

  if (position.costType === "materials") {
    const live = buildUnitPriceForCatalogPosition(position, defaultHourlyRate);
    if (pricesDiffer(stored.materials, live.materials)) {
      hints.materials = staleHintLabel(live.materials);
    }
  }

  if (position.costType === "mechanisms") {
    const live = buildUnitPriceForCatalogPosition(position, defaultHourlyRate);
    if (pricesDiffer(stored.mechanisms, live.mechanisms)) {
      hints.mechanisms = staleHintLabel(live.mechanisms);
    }
  }

  return hints;
}

export function estimateHasStaleCatalogPrices(
  categories: EstimateCategory[],
  catalogPositions: PositionPriceSummary[],
  defaultHourlyRate: number | null,
): boolean {
  return collectEstimateLineItems(categories).some((item) => {
    const hints = resolveStaleCatalogPriceHints(
      item,
      catalogPositions,
      defaultHourlyRate,
    );
    return Boolean(hints.materials || hints.mechanisms);
  });
}

function lineItemHasStaleCatalogPrices(
  item: EstimateLineItem,
  catalogPositions: PositionPriceSummary[],
  defaultHourlyRate: number | null,
): boolean {
  const hints = resolveStaleCatalogPriceHints(
    item,
    catalogPositions,
    defaultHourlyRate,
  );
  return Boolean(hints.materials || hints.mechanisms);
}

function refreshLineItemCatalogPrices(
  item: EstimateLineItem,
  catalogPositions: PositionPriceSummary[],
  defaultHourlyRate: number | null,
): EstimateLineItem {
  if (!lineItemHasStaleCatalogPrices(item, catalogPositions, defaultHourlyRate)) {
    return item;
  }

  if (isCompositeLineItem(item)) {
    return {
      ...item,
      unitPrice: deriveCompositeUnitPrice(
        item,
        catalogPositions,
        defaultHourlyRate,
      ),
    };
  }

  const position = findCatalogPositionForLineItem(item, catalogPositions);
  if (!position || !isMaterialsOrMechanismsCostType(position.costType)) {
    return item;
  }

  return {
    ...item,
    unitPrice: buildUnitPriceForCatalogPosition(position, defaultHourlyRate),
  };
}

function refreshRowItemCatalogPrices(
  row: EstimateRowItem,
  catalogPositions: PositionPriceSummary[],
  defaultHourlyRate: number | null,
): EstimateRowItem {
  if (isEstimateMultiPosition(row)) {
    return {
      ...row,
      options: row.options.map((option) => ({
        ...option,
        lineItem: refreshLineItemCatalogPrices(
          option.lineItem,
          catalogPositions,
          defaultHourlyRate,
        ),
      })),
    };
  }

  return refreshLineItemCatalogPrices(row, catalogPositions, defaultHourlyRate);
}

/** Atjaunina novecojušās materiālu / mehānismu cenas no kataloga (tikai UI, bez saglabāšanas). */
export function refreshEstimateCatalogPrices(
  categories: EstimateCategory[],
  catalogPositions: PositionPriceSummary[],
  defaultHourlyRate: number | null,
): EstimateCategory[] {
  return categories.map((category) => ({
    ...category,
    items: category.items.map((row) =>
      refreshRowItemCatalogPrices(row, catalogPositions, defaultHourlyRate),
    ),
    subcategories: category.subcategories.map((subcategory) => ({
      ...subcategory,
      items: subcategory.items.map((row) =>
        refreshRowItemCatalogPrices(row, catalogPositions, defaultHourlyRate),
      ),
    })),
  }));
}
