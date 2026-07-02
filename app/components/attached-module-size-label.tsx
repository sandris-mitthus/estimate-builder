"use client";

import { useMemo } from "react";
import { TruncatedText } from "@/app/components/truncated-text";
import { useTranslations } from "@/app/components/translations-provider";
import { formatAttachedModuleSizeFullDisplay } from "@/app/lib/modules/format-attached-module-size-display";
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
  const { t } = useTranslations();
  const fullText = useMemo(
    () =>
      attachment
        ? formatAttachedModuleSizeFullDisplay(attachment, moduleSizeOptions, t)
        : null,
    [attachment, moduleSizeOptions, t],
  );

  if (!fullText) {
    return null;
  }

  return (
    <TruncatedText
      text={fullText}
      className={`block text-[11px] font-normal leading-tight text-zinc-400 ${className}`.trim()}
      tooltipAlign="start"
    />
  );
}
