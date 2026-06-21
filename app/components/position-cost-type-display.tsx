"use client";

import {
  POSITION_COST_TYPE_ICONS,
  getPositionCostTypeLabel,
  type PositionCostType,
} from "@/app/lib/positions/position-cost-type";
import { useTranslations } from "@/app/components/translations-provider";

type PositionCostTypeDisplayProps = {
  costType: PositionCostType;
  showLabel?: boolean;
  className?: string;
  iconClassName?: string;
};

export function PositionCostTypeDisplay({
  costType,
  showLabel = true,
  className = "",
  iconClassName = "text-xs",
}: PositionCostTypeDisplayProps) {
  const { t } = useTranslations();

  return (
    <span className={`inline-flex items-center gap-2 ${className}`.trim()}>
      <i
        className={`${POSITION_COST_TYPE_ICONS[costType]} ${iconClassName}`.trim()}
        aria-hidden="true"
      />
      {showLabel ? (
        <span>{getPositionCostTypeLabel(costType, t)}</span>
      ) : null}
    </span>
  );
}
