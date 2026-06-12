"use client";

import { useMemo } from "react";
import { resolveAttachedModuleSizeDetail } from "@/app/lib/modules/format-attached-module-size-display";
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
  const detail = useMemo(
    () =>
      attachment
        ? resolveAttachedModuleSizeDetail(attachment, moduleSizeOptions)
        : null,
    [attachment, moduleSizeOptions],
  );

  if (!detail) {
    return null;
  }

  return (
    <span
      className={`block truncate text-[11px] font-normal leading-tight text-zinc-400 ${className}`.trim()}
    >
      <span className="text-zinc-300">{detail.sectionTitle}</span>
      <span className="mx-1 text-zinc-200">·</span>
      <span>{detail.label}</span>
      <span className="mx-1 text-zinc-200">·</span>
      <span className="text-zinc-500">{detail.value}</span>
    </span>
  );
}
