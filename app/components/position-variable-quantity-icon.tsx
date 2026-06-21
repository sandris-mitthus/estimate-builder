"use client";

import { Tooltip } from "@/app/components/tooltip";
import { useTranslations } from "@/app/components/translations-provider";

type PositionVariableQuantityIconProps = {
  enabled: boolean;
};

export function PositionVariableQuantityIcon({
  enabled,
}: PositionVariableQuantityIconProps) {
  const { t } = useTranslations();

  if (!enabled) return null;

  return (
    <Tooltip label={t("estimate.quantity.individual_title", "Individuāls apjoms katram projektam")}>
      <span
        className="inline-flex shrink-0 items-center text-red-600"
        aria-label={t("estimate.quantity.individual_title", "Individuāls apjoms katram projektam")}
      >
        <i className="fas fa-random text-sm" aria-hidden="true" />
      </span>
    </Tooltip>
  );
}
