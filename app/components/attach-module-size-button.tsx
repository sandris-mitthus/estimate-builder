"use client";

import { useAttachModuleSize } from "@/app/components/attach-module-size-context";
import { IconActionButton } from "@/app/components/icon-action-button";

type AttachModuleSizeButtonProps = {
  enabled: boolean;
  lineItemId: string;
  positionName: string;
  className?: string;
};

export function AttachModuleSizeButton({
  enabled,
  lineItemId,
  positionName,
  className = "",
}: AttachModuleSizeButtonProps) {
  const { openAttachModal } = useAttachModuleSize();

  if (!enabled) {
    return null;
  }

  return (
    <IconActionButton
      label="Piesaisīt moduļa lielumu"
      icon="fas fa-clipboard-list"
      variant="moduleData"
      onClick={() => openAttachModal(lineItemId, positionName)}
      className={`h-7 w-7 shrink-0 ${className}`.trim()}
    />
  );
}
