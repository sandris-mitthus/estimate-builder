"use client";

import { MULTI_OPTION_LINK_DRAG_MIME } from "@/app/lib/estimates/multi-position-links";
import { useTranslations } from "@/app/components/translations-provider";

type MultiPositionLinkHandleProps = {
  optionId: string;
  onDragStart?: (optionId: string) => void;
  onDragEnd?: () => void;
};

export function MultiPositionLinkHandle({
  optionId,
  onDragStart,
  onDragEnd,
}: MultiPositionLinkHandleProps) {
  const { t } = useTranslations();

  return (
    <span
      draggable
      onDragStart={(event) => {
        event.stopPropagation();
        event.dataTransfer.setData(MULTI_OPTION_LINK_DRAG_MIME, optionId);
        event.dataTransfer.effectAllowed = "link";
        onDragStart?.(optionId);
      }}
      onDragEnd={() => onDragEnd?.()}
      className="inline-flex h-6 w-5 shrink-0 cursor-grab items-center justify-center rounded text-zinc-300 transition hover:bg-white/80 hover:text-violet-500 active:cursor-grabbing"
      aria-label={t("estimate.multi.link_option", "Saistīt ar citu multi opciju")}
      title={t("estimate.multi.link_drag_hint", "Velc uz citu opciju, lai saistītu")}
    >
      <i className="fas fa-link text-[10px]" aria-hidden="true" />
    </span>
  );
}
