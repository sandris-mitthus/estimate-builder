"use client";

import { useMemo } from "react";
import { IconActionButton } from "@/app/components/icon-action-button";
import { TruncatedText } from "@/app/components/truncated-text";
import { MechanismQuantityControl } from "@/app/components/mechanism-quantity-control";
import { useTranslations } from "@/app/components/translations-provider";
import {
  resolveCatalogRefUnitPrice,
  resolveMechanismUnitPriceContribution,
} from "@/app/lib/estimates/composite-line-item";
import { formatMoneyDisplay } from "@/app/lib/estimates/format-money";
import { resolveCompositeLineItemDisplayUnit } from "@/app/lib/estimates/sync-module-size-quantities";
import type { EstimateLineItem, LineItemCatalogRef } from "@/app/lib/estimates/types";
import type { BuildingModuleSizeOption } from "@/app/lib/modules/types";
import type { PositionPriceSummary } from "@/app/lib/positions/types";

type MechanismBasisControlProps = {
  mechanism: LineItemCatalogRef;
  item: EstimateLineItem;
  moduleSizeOptions: BuildingModuleSizeOption[];
  catalogPositions: PositionPriceSummary[];
  currency?: string | null;
  onQuantityChange: (quantity: number) => void;
  onFixedQuantityChange: (fixedQuantity: boolean) => void;
  onRemove: () => void;
};

export function MechanismBasisControl({
  mechanism,
  item,
  moduleSizeOptions,
  catalogPositions,
  currency = null,
  onQuantityChange,
  onFixedQuantityChange,
  onRemove,
}: MechanismBasisControlProps) {
  const { t } = useTranslations();
  const positionUnit =
    resolveCompositeLineItemDisplayUnit(item, moduleSizeOptions) ?? item.unit;
  const positionUnitPrice = useMemo(() => {
    const catalogPrice = resolveCatalogRefUnitPrice(mechanism, catalogPositions);
    return resolveMechanismUnitPriceContribution(mechanism, item, catalogPrice);
  }, [mechanism, item, catalogPositions]);

  return (
    <div className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm">
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <TruncatedText
            text={mechanism.name}
            className="block text-zinc-800"
            tooltipAlign="start"
          />
          <div className="mt-0.5 text-xs text-zinc-500">
            {t("estimate.material.position_unit_price", "Uz pozīciju:")}{" "}
            <span className="font-medium tabular-nums text-zinc-700">
              {formatMoneyDisplay(positionUnitPrice, currency)} / {positionUnit}
            </span>
          </div>
        </div>
        <IconActionButton
          label={t("estimate.mechanisms.remove", "Noņemt mehānismu")}
          icon="fas fa-times"
          variant="delete"
          onClick={onRemove}
        />
      </div>

      <div className="mt-1.5 flex justify-end">
        <MechanismQuantityControl
          quantity={mechanism.consumption ?? 1}
          fixedQuantity={mechanism.fixedQuantity === true}
          unit={mechanism.unit}
          onQuantityChange={onQuantityChange}
          onFixedQuantityChange={onFixedQuantityChange}
        />
      </div>
    </div>
  );
}
