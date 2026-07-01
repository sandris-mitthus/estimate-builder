"use client";

import {
  AppModal,
  appModalWidePanelMaxWidthClassName,
} from "@/app/components/app-modal";
import { ModuleSizeAttachPicker } from "@/app/components/module-size-attach-picker";
import { useTranslations } from "@/app/components/translations-provider";
import type { LineItemModuleSizeAttachment } from "@/app/lib/estimates/types";
import type { BuildingModuleSizeOption } from "@/app/lib/modules/types";

type MaterialConsumptionVolumeModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  materialName: string;
  moduleSizeOptions: BuildingModuleSizeOption[];
  attachment: LineItemModuleSizeAttachment | null;
  onSelect: (attachment: LineItemModuleSizeAttachment | null) => void;
};

export function MaterialConsumptionVolumeModal({
  open,
  onOpenChange,
  materialName,
  moduleSizeOptions,
  attachment,
  onSelect,
}: MaterialConsumptionVolumeModalProps) {
  const { t } = useTranslations();

  function handleChange(next: LineItemModuleSizeAttachment | null) {
    if (!next) {
      return;
    }

    onSelect(next);
    onOpenChange(false);
  }

  return (
    <AppModal
      open={open}
      onOpenChange={onOpenChange}
      title={t(
        "estimate.material_consumption.pick_volume_title",
        "Patēriņa apjoms",
      )}
      description={materialName}
      panelMaxWidthClassName={appModalWidePanelMaxWidthClassName}
    >
      <ModuleSizeAttachPicker
        controlPrefix="material-consumption-volume"
        moduleSizeOptions={moduleSizeOptions}
        attachment={attachment}
        onChange={handleChange}
      />
    </AppModal>
  );
}
