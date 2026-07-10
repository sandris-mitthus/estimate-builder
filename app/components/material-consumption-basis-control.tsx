"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { AttachedModuleSizeLabel } from "@/app/components/attached-module-size-label";
import { IconActionButton } from "@/app/components/icon-action-button";
import { TruncatedText } from "@/app/components/truncated-text";
import { MaterialConsumptionInput } from "@/app/components/material-consumption-input";
import { MaterialConsumptionVolumeModal } from "@/app/components/material-consumption-volume-modal";
import { useTranslations } from "@/app/components/translations-provider";
import { resolveCatalogRefUnitPrice } from "@/app/lib/estimates/composite-line-item";
import { formatMoneyDisplay } from "@/app/lib/estimates/format-money";
import {
  hasMaterialCustomConsumptionVolume,
  resolveMaterialConsumptionBasisUnit,
  resolveMaterialUnitPriceContribution,
  shouldOfferMaterialManualConsumptionToggle,
  shouldShowMaterialConsumptionInput,
} from "@/app/lib/estimates/material-consumption-basis";
import { resolveCompositeLineItemDisplayUnit } from "@/app/lib/estimates/sync-module-size-quantities";
import type {
  EstimateLineItem,
  LineItemCatalogRef,
  LineItemModuleSizeAttachment,
} from "@/app/lib/estimates/types";
import type { BuildingModuleSizeOption } from "@/app/lib/modules/types";
import type { PositionPriceSummary } from "@/app/lib/positions/types";

type MaterialConsumptionBasisControlProps = {
  material: LineItemCatalogRef;
  item: EstimateLineItem;
  moduleSizeOptions: BuildingModuleSizeOption[];
  catalogPositions: PositionPriceSummary[];
  currency?: string | null;
  onConsumptionChange: (consumption: number) => void;
  onManualConsumptionChange: (enabled: boolean) => void;
  onVolumeAttachmentChange: (
    attachment: LineItemModuleSizeAttachment | null,
  ) => void;
  onRemove: () => void;
};

function ConsumptionValue({
  material,
  item,
  moduleSizeOptions,
  onConsumptionChange,
}: {
  material: LineItemCatalogRef;
  item: EstimateLineItem;
  moduleSizeOptions: BuildingModuleSizeOption[];
  onConsumptionChange: (consumption: number) => void;
}) {
  const { t } = useTranslations();
  const basisUnit = resolveMaterialConsumptionBasisUnit(
    material,
    item,
    moduleSizeOptions,
  );
  const showConsumption = shouldShowMaterialConsumptionInput(
    material,
    item,
    moduleSizeOptions,
  );

  if (showConsumption) {
    return (
      <div className="flex shrink-0 items-center gap-1">
        <MaterialConsumptionInput
          value={material.consumption ?? 1}
          onChange={onConsumptionChange}
          aria-label={t(
            "estimate.material_consumption.aria",
            "Patēriņš {unit} uz {positionUnit}",
            {
              unit: material.unit,
              positionUnit: basisUnit ?? "",
            },
          )}
        />
        <span className="text-xs text-zinc-400">
          {material.unit}/{basisUnit}
        </span>
      </div>
    );
  }

  return (
    <span className="shrink-0 text-xs text-zinc-400">{material.unit}</span>
  );
}

function ToggleSwitch({
  checked,
  labelId,
  label,
  onToggle,
}: {
  checked: boolean;
  labelId: string;
  label: string;
  onToggle: () => void;
}) {
  return (
    <div className="flex shrink-0 items-center gap-1">
      <span
        id={labelId}
        className="whitespace-nowrap text-[8px] font-medium uppercase leading-none tracking-tight text-zinc-400"
      >
        {label}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={labelId}
        onPointerDown={(event) => event.stopPropagation()}
        onClick={onToggle}
        className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition ${
          checked ? "bg-sky-600" : "bg-zinc-200"
        }`}
      >
        <span
          className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition ${
            checked ? "translate-x-4" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );
}

export function MaterialConsumptionBasisControl({
  material,
  item,
  moduleSizeOptions,
  catalogPositions,
  currency = null,
  onConsumptionChange,
  onManualConsumptionChange,
  onVolumeAttachmentChange,
  onRemove,
}: MaterialConsumptionBasisControlProps) {
  const { t } = useTranslations();
  const customVolumeSwitchId = useId();
  const manualConsumptionSwitchId = useId();
  const hasCustomVolume = hasMaterialCustomConsumptionVolume(material);
  const [customVolumeActive, setCustomVolumeActive] = useState(hasCustomVolume);
  const [manualConsumptionActive, setManualConsumptionActive] = useState(
    material.manualConsumption === true,
  );
  const [volumeModalOpen, setVolumeModalOpen] = useState(false);
  const canPickCustomVolume = moduleSizeOptions.length > 0;
  const offerManualConsumptionToggle = shouldOfferMaterialManualConsumptionToggle(
    material,
    item,
    moduleSizeOptions,
  );
  const positionUnit =
    resolveCompositeLineItemDisplayUnit(item, moduleSizeOptions) ?? item.unit;
  const positionUnitPrice = useMemo(() => {
    const catalogPrice = resolveCatalogRefUnitPrice(material, catalogPositions);
    return resolveMaterialUnitPriceContribution(
      material,
      item,
      catalogPrice,
      moduleSizeOptions,
    );
  }, [material, item, catalogPositions, moduleSizeOptions]);

  useEffect(() => {
    setCustomVolumeActive(hasMaterialCustomConsumptionVolume(material));
  }, [material.consumptionVolumeAttachment, material.positionPriceId]);

  useEffect(() => {
    setManualConsumptionActive(material.manualConsumption === true);
  }, [material.manualConsumption, material.positionPriceId]);

  function handleCustomVolumeToggle(enabled: boolean) {
    if (!enabled) {
      setCustomVolumeActive(false);
      onVolumeAttachmentChange(null);
      return;
    }

    if (manualConsumptionActive) {
      setManualConsumptionActive(false);
      onManualConsumptionChange(false);
    }

    setCustomVolumeActive(true);
  }

  function handleManualConsumptionToggle(enabled: boolean) {
    if (enabled && customVolumeActive) {
      setCustomVolumeActive(false);
      onVolumeAttachmentChange(null);
    }

    setManualConsumptionActive(enabled);
    onManualConsumptionChange(enabled);
  }

  function handleVolumeModalOpenChange(open: boolean) {
    setVolumeModalOpen(open);
    if (!open && !hasMaterialCustomConsumptionVolume(material)) {
      setCustomVolumeActive(false);
    }
  }

  function handleVolumeSelect(attachment: LineItemModuleSizeAttachment | null) {
    onVolumeAttachmentChange(attachment);
    if (attachment) {
      setCustomVolumeActive(true);
    }
  }

  const consumptionControls = (
    <ConsumptionValue
      material={material}
      item={item}
      moduleSizeOptions={moduleSizeOptions}
      onConsumptionChange={onConsumptionChange}
    />
  );

  const toggleControls = (
    <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
      {offerManualConsumptionToggle ? (
        <ToggleSwitch
          checked={manualConsumptionActive}
          labelId={manualConsumptionSwitchId}
          label={t("estimate.material_consumption.manual", "Patēriņš")}
          onToggle={() => handleManualConsumptionToggle(!manualConsumptionActive)}
        />
      ) : null}
      {canPickCustomVolume && !manualConsumptionActive ? (
        <ToggleSwitch
          checked={customVolumeActive}
          labelId={customVolumeSwitchId}
          label={t("estimate.material_consumption.custom_volume", "Cits apjoms")}
          onToggle={() => handleCustomVolumeToggle(!customVolumeActive)}
        />
      ) : null}
    </div>
  );

  return (
    <>
      <div className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm">
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <TruncatedText
              text={material.name}
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
          {!canPickCustomVolume ? (
            <ConsumptionValue
              material={material}
              item={item}
              moduleSizeOptions={moduleSizeOptions}
              onConsumptionChange={onConsumptionChange}
            />
          ) : null}
          <IconActionButton
            label={t("estimate.materials.remove", "Noņemt materiālu")}
            icon="fas fa-times"
            variant="delete"
            onClick={onRemove}
          />
        </div>

        {customVolumeActive ? (
          <div className="mt-2 border-t border-zinc-100 pt-2">
            {material.consumptionVolumeAttachment ? (
              <div className="flex items-start justify-between gap-2">
                <AttachedModuleSizeLabel
                  attachment={material.consumptionVolumeAttachment}
                  moduleSizeOptions={moduleSizeOptions}
                  className="min-w-0 flex-1 text-left"
                />
                <button
                  type="button"
                  onClick={() => setVolumeModalOpen(true)}
                  className="shrink-0 text-xs font-medium text-sky-600 hover:text-sky-700"
                >
                  {t("estimate.material_consumption.change_volume", "Labot")}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setVolumeModalOpen(true)}
                className="text-xs font-medium text-sky-600 hover:text-sky-700"
              >
                {t(
                  "estimate.material_consumption.pick_volume",
                  "Izvēlēt apjomu",
                )}
              </button>
            )}
          </div>
        ) : null}

        {canPickCustomVolume || offerManualConsumptionToggle ? (
          <div
            className={`space-y-1.5 ${
              customVolumeActive ? "mt-2 border-t border-zinc-100 pt-2" : "mt-1.5"
            }`}
          >
            {consumptionControls}
            <div className="flex justify-end">{toggleControls}</div>
          </div>
        ) : null}
      </div>

      {canPickCustomVolume ? (
        <MaterialConsumptionVolumeModal
          open={volumeModalOpen}
          onOpenChange={handleVolumeModalOpenChange}
          materialName={material.name}
          moduleSizeOptions={moduleSizeOptions}
          attachment={material.consumptionVolumeAttachment ?? null}
          onSelect={handleVolumeSelect}
        />
      ) : null}
    </>
  );
}
