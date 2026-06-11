"use client";

import { useMemo } from "react";
import { formatAttachedModuleSizeDisplay } from "@/app/lib/modules/format-attached-module-size-display";
import type { BuildingModuleSizeOption } from "@/app/lib/modules/types";
import type { LineItemModuleSizeAttachment } from "@/app/lib/estimates/types";

type AttachedModuleSizeLabelProps = {
  attachment?: LineItemModuleSizeAttachment;
  moduleSizeOptions: BuildingModuleSizeOption[];
  className?: string;
};

export function AttachedModuleSizeLabel({
  attachment,
  moduleSizeOptions,
  className = "",
}: AttachedModuleSizeLabelProps) {
  const display = useMemo(
    () =>
      attachment
        ? formatAttachedModuleSizeDisplay(attachment, moduleSizeOptions)
        : null,
    [attachment, moduleSizeOptions],
  );

  if (!display) {
    return null;
  }

  return (
    <span
      className={`-mt-[10px] block truncate text-[11px] font-normal leading-tight text-zinc-400 ${className}`.trim()}
    >
      {display}
    </span>
  );
}
